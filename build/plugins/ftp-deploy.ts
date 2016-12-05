import * as globStream from 'glob-stream';
import * as FS from 'graceful-fs';
import { Readable } from 'lazystream';
import * as Minimatch from 'minimatch';
import * as Path from 'path';
import * as through2 from 'through2';
import { TransformCallback } from 'through2';
import * as File from 'vinyl';
import { Ftp, FtpOptions, RemoteFile, getFileStats } from './ftp';

type Filter = ((path: string) => boolean);

function wrapRemoteFile(remoteBase: string): NodeJS.ReadWriteStream {
  return through2.obj(async (file: any, encoding: string, done: TransformCallback) => {
    file.stat = (await getFileStats(file.path)) || null;
    file.remoteBase = remoteBase;
    file.remoteStat = null;
    if (file.stat && file.stat.isFile()) {
      file.contents = new Readable(() => FS.createReadStream(file.path));
    }
    done(null, new File(file));
  });
}

export class FtpDeploy {
  constructor(private remoteBase: string, private localBase = './', private options: FtpOptions = {}) {
    this.options = Object.assign({
      host: 'localhost',
      port: 21,
      secure: false,
      user: 'anonymous',
      password: 'anonymous@',
      connTimeout: 10000,
      pasvTimeout: 10000,
      keepalive: 10000,
      autoReconnect: true,
      preserveCwd: false,

      timeOffset: 0,
      useCompression: false,

      maxRetries: 3,
      retryDelay: 3000
    }, this.options);
  }

  src(globs?: string | string[]): NodeJS.ReadWriteStream {
    const stream = globStream
      .create(this.glob(globs || Path.join(this.localBase, '**/*')), { base: this.localBase })
      .pipe(wrapRemoteFile(this.remoteBase));

    stream.on('error', stream.emit.bind(stream, 'error'));

    return stream;
  }

  clean(globs?: string | string[]): NodeJS.ReadWriteStream {
    let remoteFiles: RemoteFile[];
    return through2.obj(
      async (file: RemoteFile, encoding: string, done: TransformCallback) => {
        if (!remoteFiles) {
          try {
            remoteFiles = await this.getRemoteFiles();
          }
          catch (error) {
            done(error, file);
            return;
          }
        }

        const index = remoteFiles.findIndex(remoteFile => remoteFile.relative === file.relative);
        if (index !== -1) {
          const {remoteBase, remoteStat } = remoteFiles[index];
          file.remoteBase = remoteBase;
          file.remoteStat = remoteStat;
          remoteFiles.splice(index, 1);
        }

        done(null, file);
      },
      (done: () => void) => {

        const filters = this.glob(globs).map((glob: string) => <Filter>Minimatch.filter(glob));
        const files = remoteFiles.filter(file => filters.reduce((isMatch: boolean, filter: Filter) => isMatch && filter(file.relative), true));

        const filesToDelete = files.filter(file => file.remoteStat.isFile());
        filesToDelete.forEach(async file => await this.call(ftp => ftp.delete(file)));

        const directoriesToDelete = files.filter(file => file.remoteStat.isDirectory());
        directoriesToDelete.forEach(async directory => await this.call(ftp => ftp.rmdir(directory)));

        done();
      });
  }

  dest(): NodeJS.ReadWriteStream {
    return through2.obj(async (file: RemoteFile, encoding: string, done: TransformCallback) => {
      try {
        await this.call(ftp => ftp.mkdir(file));
        await this.call(ftp => ftp.put(file));
        done(null, file);
      }
      catch (error) {
        done(error, file);
      }
    });
  }

  private async call<T>(fn: (ftp: Ftp) => Promise<T>): Promise<T> {
    const ftp = new Ftp(this.remoteBase, this.localBase, this.options);
    try {
      await ftp.connect();

      let lastError: Error = new Error();
      let retries = 0;
      while (retries <= <number>this.options.maxRetries) {
        try {
          return await fn(ftp);
        }
        catch (error) {
          lastError = error;
          retries++;
          this.log('{yellow:Retrying...}');
          await this.sleep(<number>this.options.retryDelay)
        }
      }

      throw lastError;
    }
    finally {
      await ftp.end();
    }
  };

  private glob(glob: string | string[] = []): string[] {
    return (glob instanceof Array) ? glob : [glob];
  }

  private async getRemoteFiles(remoteFolder?: string): Promise<RemoteFile[]> {
    let files = await this.call(ftp => ftp.list(remoteFolder));

    const allFiles = await Promise.all(files.map(async file => {
      let descendantFiles: RemoteFile[] = [];
      if (file.remoteStat.isDirectory()) {
        descendantFiles = await this.getRemoteFiles(file.relative);
      }
      return [file, ...descendantFiles];
    }));

    return [].concat.apply([], allFiles);
  };

  private log(message: string): void {
    if (this.options.log) {
      this.options.log(message);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve, reject) => setTimeout(resolve, ms));
  }
}
