import * as PubSub from 'pubsub-js';
import * as path from 'path';
import { DotNetEnvironment, Environment, dotnetEnvironments, publishDir, serverUrl } from '../config';
import { ChildProcess, SpawnOptions, spawn } from 'child_process';

const defaultBuildEnvironment: Environment = 'development';
const defaultPublishEnvironment: Environment = 'production';

type DotNetTask = 'build' | 'publish' | 'run';

export interface DotNetOptions {
  cwd?: string;
  dotNetEnvironment?: DotNetEnvironment;
  environment?: Environment;
  watch?: boolean;
}

interface PluginError extends Error {
  showStack?: boolean;
}

interface StdioListener {
  (chunck: string | Buffer): boolean;
}

function getOptions(options: DotNetOptions, defaultEnvironment: Environment): DotNetOptions {
  const environment = process.env.NODE_ENV || defaultEnvironment;
  const dotNetEnvironment = dotnetEnvironments[environment];

  return Object.assign({
    cwd: path.resolve(),
    dotNetEnvironment,
    environment
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

  const environment = <DotNetEnvironment>options.dotNetEnvironment;
  const spawnArgs: Array<string> = [task, '-c', environment.configuration, '-f', environment.framework].concat(args || []);
  if (task === 'build' || task === 'publish') {
    spawnArgs.push('-r');
    spawnArgs.push(environment.runtime);
  }
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

      if (!stdout) {
        resolve(childProcess);
      }
    });

    if (detach) {
      childProcess.unref();
    }
  });
}

export function build(options: DotNetOptions = {}): Promise<ChildProcess> {
  options = getOptions(options, defaultPublishEnvironment);
  return spawnDotNet('build', options);
}

export function publish(options: DotNetOptions = {}): Promise<ChildProcess> {
  options = getOptions(options, defaultPublishEnvironment);
  return spawnDotNet('publish', options, ['-o', publishDir, '--no-build']);
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
