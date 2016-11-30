import * as path from 'path';
import { argv } from 'yargs';

// Environment & Configurations
export type Configuration = 'debug' | 'release';
export type Environment = 'development' | 'test' | 'production';
export type Runtime = 'win81-x64' | 'win10-x64';

export const ENV: Environment = (argv['env'] || process.env.NODE_ENV || 'development').toLowerCase();
process.env.NODE_ENV = ENV;

export const configurations: { [environment: string]: Configuration } = {
  development: 'debug',
  test: 'debug',
  production: 'release',
};

export const runtimes: { [environment: string]: Runtime } = {
  development: 'win10-x64',
  test: 'win10-x64',
  production: 'win81-x64',
};

// Paths
export const appDir = path.resolve('wwwroot');
export const rootDir = path.resolve();
export const tasksDir = path.resolve('build/tasks');

export const distDir = path.join(rootDir, 'dist/');

export const cleanPaths = [
  path.join(rootDir, 'bin/'),
  distDir,
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

// Others
export const browserApp = ['chrome', '--incognito'];
