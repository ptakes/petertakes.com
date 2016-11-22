import { argv } from 'yargs';
import * as path from 'path';

export type Configuration = 'debug' | 'release';
export type Environment = 'development' | 'test' | 'production';

export const ENV: Environment = (argv['env'] || process.env.NODE_ENV || 'development').toLowerCase();
process.env.NODE_ENV = ENV;

export const configurations: { [environment: string]: Configuration } = {
  development: 'debug',
  test: 'debug',
  production: 'release',
};

export const baseUrl = '/';
export const serverUrl = 'http://*:5000';

export const rootDir = path.resolve();

export const cleanPaths = [
  path.join(rootDir, 'bin/'),
  path.join(rootDir, 'dist/'),
  path.join(rootDir, 'obj/'),
  path.join(rootDir, 'npm-debug.log')
];

export const tasksDir = path.resolve('build/tasks');
