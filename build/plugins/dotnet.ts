import * as Promise from 'bluebird';
import * as path from 'path';
import { Configuration, Environment, serverUrl, configurations }  from '../config';
import { SpawnOptions, spawn } from 'child_process';

const defaultEnvironment = 'development';

interface Error {
  showStack?: boolean;
}

function makeError(message: Error): Error;
function makeError(message: string): Error;
function makeError(message): Error {
  let error: Error;
  if (message instanceof Error) {
    error = message;
  }
  else {
    error = new Error(message.toString());
  }
  error.showStack = false;
  return error;
}

export interface DotNetOptions {
  configuration?: Configuration;
  cwd?: string;
  environment?: Environment;
  watch?: boolean;
}

export function serve(options: DotNetOptions = {}) {
  options = Object.assign({
    configuration: configurations[process.env.NODE_ENV || defaultEnvironment],
    cwd: path.resolve(),
    environment: process.env.NODE_ENV || defaultEnvironment
  }, options);

  const spawnEnv = Object.create(process.env);
  spawnEnv.ASPNETCORE_ENVIRONMENT = options.environment;
  spawnEnv.ASPNETCORE_URLS = serverUrl;

  const spawnOptions: SpawnOptions = {
    cwd: options.cwd,
    env: spawnEnv,
    stdio: ['inherit', 'pipe', 'inherit']
  };

  const args: Array<string> = ['run', '-c', <string>options.configuration];
  if (options.watch) {
    args.unshift('watch');
  }

  const childProcess = spawn('dotnet', args, spawnOptions);

  return new Promise((resolve, reject) => {
    childProcess.once('error', () => reject(makeError('DotNet run failed.')));

    childProcess.stdout.on('data', data => {
      process.stdout.write(data);
      if (data.toString().indexOf('Application started') !== -1) {
        resolve(childProcess);
      }
    });

    childProcess.once('close', code => {
      if (code !== 0) {
        reject(makeError('DotNet run failed.'));
      }
    });

    childProcess.unref();
  });
}
