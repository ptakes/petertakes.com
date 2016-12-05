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

  maxRetries?: number;
  retryDelay?: number;

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

  async call<T>(fn: (ftp: Ftp) => Promise<T>): Promise<T> {
    try {
      await this.tryConnect();
      return await this.tryCall(fn);
    }
    finally {
      await this.end();
    }
  };

  async connect(): Promise<Ftp> {
    await this.ftp.connect(this.options);
    return this;
  }

  async delete(file: RemoteFile): Promise<RemoteFile> {
    if (!file.remoteStat || !file.remoteStat.isFile()) {
      return file;
    }

    this.log(`DEL ${file.relative}`);
    await this.ftp.delete(getRemotePath(file));
    return file;
  }

  async end(): Promise<boolean | Error> {
    return await this.ftp.end();
  }

  async list(folder = '.', recursive = true): Promise<RemoteFile[]> {
    this.log(`LIST ${folder}`);
    const entries = await (this.ftp.list(Path.join(this.remoteBase, folder)));

    const files = await Promise.all(entries.map(async entry => {
      const path = Path.join(this.localBase, folder, entry.name);

      return <RemoteFile>new File({
        base: this.localBase,
        path: path,
        stat: (await getFileStats(path)) || null,
        remoteBase: this.remoteBase,
        remoteStat: new RemoteStat(entry, <number>this.options.timeOffset)
      });
    }));

    let allFiles: RemoteFile[][] = [];
    if (recursive) {
      allFiles = await Promise.all(files.map(async file => {
        let descendantFiles: RemoteFile[] = [];
        if (file.remoteStat.isDirectory()) {
          descendantFiles = await this.list(file.relative, recursive);
        }
        return [file, ...descendantFiles];
      }));
    }

    return [].concat.apply([], allFiles);
  }

  async mkdir(file: RemoteFile, recursive = true): Promise<RemoteFile> {
    const relative = file.isDirectory() ? file.relative : Path.dirname(file.relative);
    if (relative !== '/' && relative !== '.' && relative !== '..') {
      if (file.isDirectory()) {
        this.log(`MKDIR ${relative}`);
      }
      await this.ftp.mkdir(getRemotePath(file, relative), recursive);
    }

    return file;
  };

  async put(file: RemoteFile): Promise<RemoteFile> {
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
    await this.ftp.put(stream, getRemotePath(file), this.options.useCompression);
    return file;
  }

  async rmdir(file: RemoteFile, recursive = true): Promise<RemoteFile> {
    if (!file.remoteStat || !file.remoteStat.isDirectory()) {
      return file;
    }

    this.log(`RMDIR ${file.relative}`);
    await this.ftp.rmdir(getRemotePath(file), recursive);
    return file;
  }

  private log(message: string): void {
    if (this.options.log) {
      this.options.log(message);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve, reject) => setTimeout(resolve, ms));
  }

  private async tryCall<T>(fn: (ftp: Ftp) => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    let retries = 0;
    while (retries <= <number>this.options.maxRetries) {
      try {
        return await fn(this);
      }
      catch (error) {
        lastError = error;
        retries++;
        this.log('Retrying...');
        await this.sleep(<number>this.options.retryDelay)
      }
    }

    throw lastError;
  }

  private async tryConnect(): Promise<void> {
    let lastError: Error | null = null;
    let retries = 0;
    while (retries <= <number>this.options.maxRetries) {
      try {
        await this.connect();
        return;
      }
      catch (error) {
        lastError = error;
        retries++;
        this.log('Retrying to connect...');
        await this.sleep(<number>this.options.retryDelay)
      }
    }

    throw lastError;
  }
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
