import { async, await } from 'asyncawait';
import * as FS from 'graceful-fs';
import * as Path from 'path';
import * as PromiseFtp from 'promise-ftp';
import { ListEntry } from 'promise-ftp';
import { PassThrough, Readable } from 'stream';
import * as File from 'vinyl';

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

  log?: (message: string) => void;
};

export interface RemoteFile extends File {
  remoteBase: string;
  remoteStat: FS.Stats;
}

export function getFileStats(path: string): Promise<FS.Stats> {
  return new Promise<FS.Stats>((resolve, reject) =>
    FS.lstat(path, (error: Error, stats: FS.Stats) =>
      resolve(!error ? stats : undefined)
    ));
}

function getRemotePath(file: RemoteFile, relative?: string): string {
  return Path.join(file.remoteBase, relative || file.relative).replace(/\\/g, '/');
}

export class Ftp {
  private ftp: PromiseFtp;

  constructor(private remoteBase: string, private localBase = './', private options: FtpOptions = {}) {
    this.ftp = new PromiseFtp();
  }

  connect = async(() => {
    await(this.ftp.connect(this.options));
    return this;
  });

  delete = async((file: RemoteFile) => {
    if (!file.remoteStat || !file.remoteStat.isFile()) {
      return file;
    }

    this.log(`DEL ${file.relative}`);
    await(this.ftp.delete(getRemotePath(file)));
    return file;
  });

  end = async(() => await(this.ftp.end()));

  list = <(folder?: string) => Promise<RemoteFile[]>>async((folder = '.') => {
    this.log(`LIST ${folder}`);
    const files = await(this.ftp.list(Path.join(this.remoteBase, folder)));
    return files.map(file => {
      const path = Path.join(this.localBase, folder, file.name);

      return <RemoteFile>new File(<any>{
        base: this.localBase,
        path: path,
        stat: await(getFileStats(path)) || null,
        remoteBase: this.remoteBase,
        remoteStat: new RemoteStat(file, <number>this.options.timeOffset)
      });
    });
  });

  log(message: string): void {
    if (this.options.log) {
      this.options.log(message);
    }
  }

  mkdir = async((file: RemoteFile, recursive = true) => {
    const relative = file.isDirectory() ? file.relative : Path.dirname(file.relative);
    if (relative !== '/' && relative !== '.' && relative !== '..') {
      if (file.isDirectory()) {
        this.log(`MKDIR ${relative}`);
      }
      await(this.ftp.mkdir(getRemotePath(file, relative), recursive));
    }

    return file;
  });

  put = async((file: RemoteFile) => {
    if (file.isDirectory() || file.isNull()) {
      return file;
    }

    const stream = new PassThrough();
    if (file.isStream()) {
      (<Readable>file.contents).pipe(stream);
    }
    else if (file.isBuffer()) {
      stream.end(file.contents);
    }

    this.log(`PUT ${file.relative}`);
    await(this.ftp.put(stream, getRemotePath(file), this.options.useCompression));
    return file;
  });

  rmdir = async((file: RemoteFile, recursive = true) => {
    if (!file.remoteStat || !file.remoteStat.isDirectory()) {
      return file;
    }

    this.log(`RMDIR ${file.relative}`);
    await(this.ftp.rmdir(getRemotePath(file), recursive));
    return file;
  });
}

class RemoteStat implements FS.Stats {
  private type: 'l' | 'd' | '-';

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
    return this.type === '-';;
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
    return this.type === 'l';
  }

  isFIFO(): boolean {
    return false;
  }

  isSocket(): boolean {
    return false;
  }
}
