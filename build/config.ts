import * as path from 'path';
import { argv } from 'yargs';

// Environments & Configurations
export type Environment = 'development' | 'test' | 'production';

export const ENV: Environment = (argv['env'] || process.env.NODE_ENV || 'development').toLowerCase();
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
export const appDir = path.resolve('wwwroot');
export const rootDir = path.resolve();
export const tasksDir = path.resolve('build/tasks');

export const publishDir = path.join(rootDir, 'dist/');

export const cleanPaths = [
  path.join(rootDir, 'bin/'),
  publishDir,
  path.join(rootDir, 'obj/'),
  path.join(rootDir, 'npm-debug.log')
];

export const globPaths = [
  path.join(rootDir, 'node_modules/'),
  path.join(rootDir, 'typings/'),
  path.join(rootDir, 'project.lock.json')
];

export const cssPaths = [`${appDir}**/*.css`];
export const htmlPaths = [`${appDir}**/*.html`];
export const jsPaths = [`${appDir}**/*.js`];

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
