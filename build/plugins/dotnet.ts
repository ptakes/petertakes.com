import * as Promise from 'bluebird';
import * as PubSub from 'pubsub-js';
import * as path from 'path';
import { Configuration, Environment, Runtime, configurations, distDir, runtimes, serverUrl } from '../config';
import { ChildProcess, SpawnOptions, spawn } from 'child_process';

const defaultBuildEnvironment: Environment = 'development';
const defaultPublishEnvironment: Environment = 'production';

type DotNetTask = 'build' | 'publish' | 'run';

export interface DotNetOptions {
  configuration?: Configuration;
  cwd?: string;
  environment?: Environment;
  runtime?: Runtime;
  watch?: boolean;
}

interface PluginError extends Error {
  showStack?: boolean;
}

interface StdioListener {
  (chunck: string | Buffer): boolean;
}

function getOptions(options: DotNetOptions, defaultEnvironment: Environment): DotNetOptions {
  return Object.assign({
    configuration: configurations[process.env.NODE_ENV || defaultEnvironment],
    cwd: path.resolve(),
    environment: process.env.NODE_ENV || defaultEnvironment,
    runtime: runtimes[process.env.NODE_ENV || defaultEnvironment]
  }, options);
}

function getProcessEnv(options: DotNetOptions): any {
  const env: any = Object.assign({}, process.env);
  env.ASPNETCORE_ENVIRONMENT = options.environment;
  env.ASPNETCORE_URLS = serverUrl;

  return env;
}

function pluginError(message: string, innerError?: Error): PluginError {
  const error: PluginError = new Error(message.toString());
  if (innerError && innerError.message) {
    error.message += ` ${innerError.message}`;
  }
  error.showStack = false;
  return error;
}

function spawnDotNet(task: DotNetTask, options: DotNetOptions, args?: Array<string>, stdout?: StdioListener, detach?: boolean): Promise<ChildProcess> {
  const spawnOptions: SpawnOptions = {
    cwd: options.cwd,
    env: getProcessEnv(options),
    stdio: ['inherit', (stdout ? 'pipe' : 'inherit'), 'inherit']
  };

  const spawnArgs: Array<string> = [task, '-c', <string>options.configuration].concat(args || []);
  if (options.watch) {
    spawnArgs.unshift('watch');
  }

  const childProcess: ChildProcess = spawn('dotnet', spawnArgs, spawnOptions);

  return new Promise<ChildProcess>((resolve, reject) => {
    childProcess.once('error', error => reject(pluginError(`DotNet ${task} failed.`, error)));

    if (stdout) {
      childProcess.stdout.on('data', data => {
        process.stdout.write(data);
        if (stdout(data)) {
          resolve(childProcess);
        }
      });
    }

    childProcess.once('close', code => {
      if (code !== 0) {
        reject(pluginError(`DotNet ${task} failed.`));
        return;
      }

      if (!stdout && !detach) {
        resolve(childProcess);
      }
    });

    if (detach) {
      childProcess.unref();
      resolve(childProcess);
    }
  });
}

export function build(options: DotNetOptions = {}): Promise<ChildProcess> {
  options = getOptions(options, defaultPublishEnvironment);
  return spawnDotNet('build', options);
}

export function publish(options: DotNetOptions = {}): Promise<ChildProcess> {
  options = getOptions(options, defaultPublishEnvironment);
  return spawnDotNet('publish', options, ['-o', distDir, '-r', <string>options.runtime]);
}

export function serve(options: DotNetOptions = {}): Promise<ChildProcess> {
  options = getOptions(options, defaultBuildEnvironment);
  const listener: StdioListener = chunck => chunck.toString().indexOf('Application started') !== -1;

  return spawnDotNet('run', options, [], listener, true)
    .then(childProcess => {
      PubSub.publish('dotnet:run:started', childProcess);
      return childProcess;
    });
}
