import * as globStream from 'glob-stream';
import * as FS from 'graceful-fs';
import { Readable } from 'lazystream';
import * as Minimatch from 'minimatch';
import * as Path from 'path';
import * as through2 from 'through2';
import * as File from 'vinyl';
import { Ftp, FtpOptions, RemoteFile, getFileStats } from './ftp';

type TransformCallback = (error?: any, data?: any) => void;
type TransformFunction = (chunk: any, enc: string, callback: TransformCallback) => void;
type FlushCallback = () => void;

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

  src(globs: string | string[] = Path.join(this.localBase, '**/*')): NodeJS.ReadWriteStream {
    const glob = (globs instanceof Array) ? globs : [globs];

    const stream = globStream
      .create(glob, { base: this.localBase })
      .pipe(wrapRemoteFile(this.remoteBase));

    stream.on('error', stream.emit.bind(stream, 'error'));

    return stream;
  }

  clean(globs: string | string[] = []): NodeJS.ReadWriteStream {
    const glob = (globs instanceof Array) ? globs : [globs];

    let remoteFiles: RemoteFile[];
    return through2.obj(
      async (file: RemoteFile, encoding: string, done: TransformCallback) => {
        if (!remoteFiles) {
          try {
            const ftp = new Ftp(this.remoteBase, this.localBase, this.options);
            remoteFiles = await ftp.call(async ftp => await ftp.list());
          }
          catch (error) {
            done(error, file);
            return;
          }
        }

        const index = remoteFiles.findIndex(remoteFile => remoteFile.relative === file.relative);
        if (index !== -1) {
          const { remoteBase, remoteStat } = remoteFiles[index];
          file.remoteBase = remoteBase;
          file.remoteStat = remoteStat;
          remoteFiles.splice(index, 1);
        }

        done(null, file);
      },
      async (done: FlushCallback) => {
        const filters = glob.map((item: string) => <Filter>Minimatch.filter(item));
        const files = remoteFiles.filter(file => filters.reduce((isMatch: boolean, filter: Filter) => isMatch && filter(file.relative), true));

        const ftp = new Ftp(this.remoteBase, this.localBase, this.options);
        await ftp.call(async ftp => {
          for (let file of files.filter(file => file.remoteStat.isFile())) {
            await ftp.delete(file)
          }

          for (let directory of files.filter(file => file.remoteStat.isDirectory())) {
            await ftp.rmdir(directory)
          }

          return Promise.resolve();
        });

        done();
      });
  }

  dest(): NodeJS.ReadWriteStream {
    let files: RemoteFile[] = [];

    return through2.obj(
      (file: RemoteFile, encoding: string, done: TransformCallback) => {
        files.push(file);
        done(null, file);
      },
      async (done: FlushCallback) => {
        try {
          const ftp = new Ftp(this.remoteBase, this.localBase, this.options);
          await ftp.call(async ftp => {
            for (let directory of files.filter(file => (<FS.Stats>file.stat).isDirectory())) {
              await ftp.mkdir(directory);
            }

            for (let file of files.filter(file => (<FS.Stats>file.stat).isFile())) {
              await ftp.put(file);
            }

            return Promise.resolve();
          });
        }
        finally {
          done();
        }
      });
  }
}
