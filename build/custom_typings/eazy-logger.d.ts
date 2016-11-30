declare module 'eazy-logger' {
  export enum LogLevel {
    'trace',
    'debug',
    'warn',
    'info',
    'error'
  }

  export interface LoggerConfig {
    level?: LogLevel,
    prefix?: string,
    useLevelPrefixes?: boolean
  }

  export class Logger  {
    constructor(config?: LoggerConfig);
    
    canLog (level: LogLevel): boolean;
    clone(options: LoggerConfig | ((config: LoggerConfig) => LoggerConfig)): Logger;
    log(level: LogLevel, message: string, ...args: Array<any>): Logger;
    mute(mute: boolean): Logger;
    reset(): Logger;
    setLevel(level: LogLevel): Logger;
    setLevelPrefixes (state: boolean): Logger;
    setOnce(config: 'level' | 'prefix' | 'useLevelPrefixes', value: any): Logger;
    unprefixed(level: LogLevel, message: string, ...args: Array<any>): Logger;

    trace(message: string, ...args: Array<any>): Logger;
    debug(message: string, ...args: Array<any>): Logger;
    warn(message: string, ...args: Array<any>): Logger;
    info(message: string, ...args: Array<any>): Logger;
    error(message: string, ...args: Array<any>): Logger;
  }
}
