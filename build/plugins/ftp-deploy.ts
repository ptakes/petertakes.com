import * as File from 'vinyl';
import * as FS from 'graceful-fs';
import * as Path from 'path';
import * as Promise from 'bluebird';
import * as globStream from 'glob-stream';
import * as through2 from 'through2';
import { TransformCallback } from 'through2';
import { Readable } from 'lazystream';
import { Ftp, FtpFile, FtpOptions, stats } from './ftp';

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

      parallel: 3,
      maxRetries: 5,
      retryInterval: 3000
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

  clean(): NodeJS.ReadWriteStream {
    const self = this;
    const remoteFiles = this.getRemoteFiles();
    return through2.obj(transform, flush);

    function flush(callback: () => void): void {
      remoteFiles
        .each((remoteFile: FtpFile) => {
          if (remoteFile.remoteStat.isDirectory()) {
            return remoteFile;
          }

          return self.getFtpConnection()
            .then(ftp => ftp.delete(remoteFile)
              .finally(() => ftp.end()));
        })
        .each((remoteFile: FtpFile) => {
          if (!remoteFile.remoteStat.isDirectory()) {
            return remoteFile;
          }

          return self.getFtpConnection()
            .then(ftp => ftp.rmdir(remoteFile)
              .catch(() => remoteFile)
              .finally(() => ftp.end()));
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
          callback(null, file)
        })
        .catch(error => callback(error, file));
    }
  }

  dest(): NodeJS.ReadWriteStream {
    const self = this;
    return through2.obj(transform, flush);

    function flush(callback: () => void): void {
      callback();
    }

    function transform(file: FtpFile, encoding: string, callback: TransformCallback): void {
      self.getFtpConnection()
        .then((ftp: Ftp) => self.upload(ftp, file))
        .then(() => callback(null, file))
        .catch((error: Error) => callback(error, file));
    }
  }

  private getFtpConnection(retries = { count: 0 }): Promise<Ftp> {
    // TODO: throttle parallel connections
    const ftp = new Ftp(this.remoteBase, this.localBase, this.options);
    return ftp.connect()
      .then(() => ftp)
      .catch(error => {
        if (retries.count < this.options.maxRetries) {
          this.log('Retrying to connect to server...');
          retries.count++;

          return Promise.delay(<number>this.options.retryInterval)
            .then(() => this.getFtpConnection(retries));
        }
        return Promise.reject(error);
      });
  }

  private getRemoteFiles(remoteFolder?: string): Promise<FtpFile[]> {
    return this.getFtpConnection()
      .then(ftp => ftp.list(remoteFolder)
        .map((remoteFile: FtpFile) => {
          if (remoteFile.remoteStat.isDirectory()) {
            return this.getRemoteFiles(remoteFile.relative)
              .then(remoteFiles => [remoteFile].concat(remoteFiles));
          }
          return [remoteFile];
        })
        .then(remoteFiles => ftp.end()
          .then(() => [].concat.apply([], remoteFiles))
        )
      );
  }

  private log(message: string): void {
    if (this.options.log) {
      this.options.log(message);
    }
  }

  private upload(ftp: Ftp, file: FtpFile, retries = { count: 0 }): Promise<FtpFile> {
    return ftp.mkdir(file)
      .then(() => ftp.put(file))
      .then(() => ftp.end())
      .then(() => file)
      .catch(error => {
        if (retries.count < this.options.maxRetries) {
          this.log('Retrying to upload...');
          retries.count++;

          return Promise.delay(<number>this.options.retryInterval)
            .then(() => this.upload(ftp, file, retries));
        }
        return Promise.reject(error);
      });
  }
}
