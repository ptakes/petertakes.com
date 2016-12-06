import * as Path from 'path';
import * as PubSub from 'pubsub-js';
import * as gulp from 'gulp';
import { webDir } from '../config';
import { logger } from '../plugins/logger';
import { reloadBrowser } from '../plugins/browser-link';

let started = false;
PubSub.subscribe('dotnet:run:started', () => started && reloadBrowser());

function reportChange(file: string): void {
  logger.info(`File changed: {cyan:${file}}`);
}

function watchApp() {
  gulp.watch(Path.join(webDir, '**/*'), reloadBrowser).on('change', reportChange);
  started = true;
}

gulp.task('watch', gulp.series([
  'build:watch',
  'serve:dotnet:watch',
  watchApp
]));
