import { argv } from 'yargs';
import * as path from 'path';

export const ENV: 'development' | 'production' | 'test' = (argv['env'] || process.env.NODE_ENV || 'development').toLowerCase();
process.env.NODE_ENV = ENV;

export const baseUrl = '/';
export const rootDir = path.resolve();

export const cleanPaths = [
  path.join(rootDir, 'bin/'),
  path.join(rootDir, 'dist/'),
  path.join(rootDir, 'obj/'),
  path.join(rootDir, 'npm-debug.log')
];

export const tasksDir = path.resolve('build/tasks');
