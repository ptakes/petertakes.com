import { argv } from 'yargs';
import * as path from 'path';

// Environment & Configurations
export type Configuration = 'debug' | 'release';
export type Environment = 'development' | 'test' | 'production';

export const ENV: Environment = (argv['env'] || process.env.NODE_ENV || 'development').toLowerCase();
process.env.NODE_ENV = ENV;

export const configurations: { [environment: string]: Configuration } = {
  development: 'debug',
  test: 'debug',
  production: 'release',
};

// Paths
export const appDir = path.resolve('wwwroot');
export const rootDir = path.resolve();
export const tasksDir = path.resolve('build/tasks');

export const cleanPaths = [
  path.join(rootDir, 'bin/'),
  path.join(rootDir, 'dist/'),
  path.join(rootDir, 'obj/'),
  path.join(rootDir, 'npm-debug.log')
];

export const cssPaths = [`${appDir}**/*.css`];
export const htmlPaths = [`${appDir}**/*.html`];
export const jsPaths = [`${appDir}**/*.js`];

// URLs
export const baseUrl = '/';
export const proxyPort = 3000;
export const proxyUIPort = 3001;
export const serverUrl = 'http://localhost:5000';

// Tools
export const browserApp = ['chrome', '--incognito'];
