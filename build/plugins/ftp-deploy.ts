import * as File from 'vinyl';
import * as FS from 'graceful-fs';
import * as Minimatch from 'minimatch';
import * as Path from 'path';
import * as Promise from 'bluebird';
import { Disposer } from 'bluebird';
import * as globStream from 'glob-stream';
import * as through2 from 'through2';
import { TransformCallback } from 'through2';
import { Readable } from 'lazystream';
import { Ftp, FtpFile, FtpOptions, stats } from './ftp';

type Filter = ((path: string) => boolean);

function wrapFtpFile(remoteBase: string): NodeJS.ReadWriteStream {
  return through2.obj((file: any, encoding: string, callback: TransformCallback) => {
    stats(file.path).then(stats => {
      file.stat = stats || null;
      file.remoteBase = remoteBase;
      file.remoteStat = null;
      if (file.stat && file.stat.isFile()) {
        file.contents = new Readable(() => FS.createReadStream(file.path));
      }
      callback(null, <FtpFile>new File(file));
    });
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
    }, this.options);
  }

  src(glob?: string | string[]): NodeJS.ReadWriteStream {
    glob = (glob instanceof Array) ? glob : [glob || Path.join(this.localBase, '**/*')];

    const stream = globStream
      .create(glob, { base: this.localBase })
      .pipe(wrapFtpFile(this.remoteBase));

    stream.on('error', stream.emit.bind(stream, 'error'));

    return stream;
  }

  clean(glob?: string | string[]): NodeJS.ReadWriteStream {
    const remoteFiles = this.getRemoteFiles();
    return through2.obj(transform.bind(this), flush.bind(this));

    function flush(callback: () => void): void {
      const patterns = (glob && glob.constructor === Array)
        ? <string[]>glob
        : (glob ? [<string>glob] : []);
      const filters = patterns.map(patterh => <Filter>Minimatch.filter(patterh));

      remoteFiles
        .filter((remoteFile: FtpFile) =>
          filters.reduce((isMatch: boolean, filter: Filter) => isMatch && filter(remoteFile.relative), true)
        )
        .each((remoteFile: FtpFile) => {
          if (remoteFile.remoteStat.isDirectory()) {
            return remoteFile;
          }

          return Promise.using(this.getConnection(), (ftp: Ftp) =>
            ftp.delete(remoteFile)
          );
        })
        .each((remoteFile: FtpFile) => {
          if (!remoteFile.remoteStat.isDirectory()) {
            return remoteFile;
          }

          return Promise.using(this.getConnection(), (ftp: Ftp) =>
            ftp.rmdir(remoteFile).catch(() => remoteFile)
          );
        })
        .finally(callback);
    }

    function transform(file: FtpFile, encoding: string, callback: TransformCallback): void {
      remoteFiles
        .then(remoteFiles => {
          const index = remoteFiles.findIndex(remoteFile => file.relative === remoteFile.relative);
          if (index !== -1) {
            const remoteFile = remoteFiles[index];
            file.remoteBase = remoteFile.remoteBase;
            file.remoteStat = remoteFile.remoteStat;
            remoteFiles.splice(index, 1);
          }
          callback(null, file);
        })
        .catch(error => callback(error, file));
    }
  }

  dest(): NodeJS.ReadWriteStream {
    return through2.obj((file: FtpFile, encoding: string, callback: TransformCallback) =>
      Promise.using(this.getConnection(), (ftp: Ftp) =>
        ftp.mkdir(file)
          .then(() => ftp.put(file))
          .then(() => callback(null, file))
          .catch((error: Error) => callback(error, file))
      )
    );
  }

  private getConnection(): Disposer<Ftp> {
    return new Ftp(this.remoteBase, this.localBase, this.options)
      .connect()
      .disposer(ftp => ftp.end());
  }

  private getRemoteFiles(remoteFolder?: string): Promise<FtpFile[]> {
    return Promise.using(this.getConnection(), (ftp: Ftp) =>
      ftp.list(remoteFolder)
        .map((remoteFile: FtpFile) => {
          if (remoteFile.remoteStat.isDirectory()) {
            return this.getRemoteFiles(remoteFile.relative)
              .then(remoteFiles => [remoteFile].concat(remoteFiles));
          }
          return [remoteFile];
        })
        .then(remoteFiles => [].concat.apply([], remoteFiles))
    );
  }
}
