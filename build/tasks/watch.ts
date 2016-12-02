import * as PubSub from 'pubsub-js';
import * as gulp from 'gulp';
import { cssPaths, htmlPaths, jsPaths } from '../config';
import { logger } from '../plugins/logger';
import { reloadBrowser } from '../plugins/browser-link';

let started = false;
PubSub.subscribe('dotnet:run:started', () => started && reloadBrowser());

function reportChange(file: string): void {
  logger.info(`File changed: {cyan:${file}}`);
}

function watchApp() {
  gulp.watch(cssPaths, reloadBrowser).on('change', reportChange);
  gulp.watch(htmlPaths, reloadBrowser).on('change', reportChange);
  gulp.watch(jsPaths, reloadBrowser).on('change', reportChange);
  started = true;
}

gulp.task('watch', gulp.series([
  'serve:dotnet:watch',
  watchApp
]));
