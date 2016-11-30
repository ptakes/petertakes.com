declare module 'lazystream' {
  module lazystream {
    export class Readable {
      constructor(fn: (options?: any) => NodeJS.ReadableStream, options?: any) { }
    }

    export class Writable {
      constructor(fn: (options?: any) => NodeJS.WritableStream, options?: any) { }
    }
  }

  export = lazystream;
}
