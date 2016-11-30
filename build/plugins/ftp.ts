import * as File from 'vinyl';
import * as FS from 'graceful-fs';
import * as Path from 'path';
import * as Promise from 'bluebird';
import * as PromiseFtp from 'promise-ftp';
import { ListEntry } from 'promise-ftp';
import { PassThrough, Readable } from 'stream';

export function stats(path: string): Promise<FS.Stats> {
  return new Promise<FS.Stats>((resolve, reject) => {
    FS.lstat(path, (error: Error, stats: FS.Stats) => {
      resolve(!error ? stats : undefined);
    });
  });
}

export class RemoteStat implements FS.Stats {
  private type: '' | 'd' | '-';

  atime: Date;
  birthtime: Date;
  blksize: number;
  blocks: number;
  ctime: Date;
  dev: number = 0;
  gid: number = 0;
  ino: number = 0;
  mode: number;
  mtime: Date;
  nlink: number = 1;
  rdev: number = 0;
  size: number;
  uid: number = 0;

  constructor(entry: ListEntry, timeOffset: number) {
    entry.date.setTime(entry.date.getTime() + timeOffset * 60000);
    this.type = entry.type;
    this.size = parseInt(entry.size, 10);
    this.mtime = this.atime = this.ctime = this.birthtime = entry.date;
  }

  isFile(): boolean {
    return !this.isDirectory() && !this.isSymbolicLink();
  }

  isDirectory(): boolean {
    return this.type === 'd';
  }

  isBlockDevice(): boolean {
    return false;
  }

  isCharacterDevice(): boolean {
    return false;
  }

  isSymbolicLink(): boolean {
    return this.type === '-';
  }

  isFIFO(): boolean {
    return false;
  }

  isSocket(): boolean {
    return false;
  }
}

export interface FtpFile extends File {
  remoteBase: string;
  remoteStat: FS.Stats;
}

export interface FtpOptions {
  host?: string;
  port?: number;
  secure?: boolean | 'control' | 'implicit';
  secureOptions?: any;
  user?: string;
  password?: string;
  connTimeout?: number;
  pasvTimeout?: number;
  keepalive?: number;
  autoReconnect?: boolean;
  preserveCwd?: boolean;

  timeOffset?: number;
  useCompression?: boolean;

  maxRetries?: number;
  retryInterval?: number;
  log?: (message: string) => void;
};

export class Ftp {
  private ftp: PromiseFtp;

  constructor(private remoteBase: string, private localBase = './', private options: FtpOptions = {}) {
    this.ftp = new PromiseFtp();
  }

  connect(): Promise<string> {
    return Promise.resolve(this.ftp.connect(this.options));
  }

  delete(file: FtpFile): Promise<FtpFile> {
    this.log(`DEL ${file.relative}`);
    return Promise.resolve(this.ftp.delete(this.getPath(file)))
      .then(() => file);
  }

  end(): Promise<boolean | Error> {
    return Promise.resolve(this.ftp.end());
  }

  list(folder = './'): Promise<FtpFile[]> {
    return Promise.resolve(this.ftp.list(Path.join(this.remoteBase, folder)))
      .then(remoteFiles => {
        const allRemoteFiles: Promise<FtpFile>[] = [];

        remoteFiles.forEach(remoteFile => {
          const path = Path.join(this.localBase, folder, remoteFile.name);
          allRemoteFiles.push(stats(path)
            .then(stats => {
              return <FtpFile>new File(<any>{
                base: this.localBase,
                path: path,
                stat: stats || null,
                remoteBase: this.remoteBase,
                remoteStat: new RemoteStat(remoteFile, <number>this.options.timeOffset)
              });
            }));
        });

        return Promise.all(allRemoteFiles);
      });
  }

  log(message: string): void {
    if (this.options.log) {
      this.options.log(message);
    }
  }

  mkdir(file: FtpFile, recursive = true): Promise<FtpFile> {
    const relative = file.isDirectory() ? file.relative : Path.dirname(file.relative);

    if (file.isDirectory()) {
      this.log(`MKDIR ${relative}`);
    }

    return Promise.resolve(this.ftp.mkdir(this.getPath(file, relative), recursive))
      .then(() => file);
  }

  put(file: FtpFile): Promise<FtpFile> {
    if (file.isDirectory() || file.isNull()) {
      return Promise.resolve(file);
    }

    const stream = new PassThrough();
    if (file.isStream()) {
      (<Readable>file.contents).pipe(stream);
    }
    else if (file.isBuffer()) {
      stream.end(file.contents);
    }

    this.log(`PUT ${file.relative}`);
    return Promise.resolve(this.ftp.put(stream, this.getPath(file), this.options.useCompression))
      .then(() => file);
  }

  rmdir(file: FtpFile, recursive = true): Promise<FtpFile> {
    if (!(file.isDirectory() || file.isNull())) {
      return Promise.resolve(file);
    }

    this.log(`RMDIR ${file.relative}`);
    return Promise.resolve(this.ftp.rmdir(this.getPath(file), recursive))
      .then(() => file);
  }

  private getPath(file: FtpFile, relative?: string): string {
    return Path.join(file.remoteBase, relative || file.relative).replace(/\\/g, '/');
  }
}