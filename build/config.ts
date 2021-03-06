import * as Path from 'path';
import { argv } from 'yargs';

// Environments & Configurations
export type Environment = 'development' | 'test' | 'production';

export const ENV: Environment = (argv.env || process.env.NODE_ENV || 'development').toLowerCase();
process.env.NODE_ENV = ENV;

export interface DotNetEnvironment {
  configuration: 'debug' | 'release';
  framework: 'net452' | 'netcoreapp1.1';
  runtime: 'win81-x64' | 'win10-x64';
}

export const dotnetEnvironments: { [environment: string]: DotNetEnvironment } = {
  development: {
    configuration: 'debug',
    framework: 'netcoreapp1.1',
    runtime: 'win10-x64'
  },
  test: {
    configuration: 'debug',
    framework: 'netcoreapp1.1',
    runtime: 'win10-x64'
  },
  production: {
    configuration: 'release',
    framework: 'net452',
    runtime: 'win81-x64'
  }
};

// Paths
export const appRootDir = Path.resolve('app');
export const appDir = Path.resolve('app/src');
export const rootDir = Path.resolve();
export const webRootDir = Path.resolve('wwwroot');

export const publishDir = Path.join(rootDir, 'dist/');

export const makeAppRootRelative = (path: string) => `./${Path.relative(rootDir, Path.join(appRootDir, path)).replace(/\\/g, '/')}`;

export const cleanPaths = [
  Path.join(rootDir, 'bin/'),
  Path.join(rootDir, 'obj/'),
  Path.join(rootDir, 'npm-debug.log'),
  webRootDir
];

export const globPaths = [
  Path.join(rootDir, '.awcache/'),
  Path.join(rootDir, 'node_modules/'),
  Path.join(rootDir, 'project.lock.json'),
  Path.join(rootDir, 'typings/'),
  publishDir
];

// App
export const appName = 'Peter Takes';
export const appMain = `./${Path.relative(rootDir, Path.join(appDir, 'main')).replace(/\\/g, '/')}`;
export const loglevel = ENV === 'production' ? 'warn' : 'debug';

// URLs
export const baseUrl = '/';
export const proxyPort = 3000;
export const proxyUIPort = 3001;
export const serverUrl = 'http://localhost:5000';

// Deploy
export const ftpHost = 'petertakes.com';
export const ftpUser: string = process.env.FTP_USR || argv['usr'];
export const ftpPassword: string = process.env.FTP_PWD || argv['pwd'];
export const ftpRoot = 'petertakes.com/wwwroot';
export const ftpCleanPaths = ['!logs'];

// Others
export const browserApp = ['chrome', '--incognito'];
