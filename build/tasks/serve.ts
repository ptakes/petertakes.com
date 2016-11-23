import * as gulp from 'gulp';
import { openBrowser, reloadBrowser } from '../plugins/browser-sync';
import { serve as serveApi } from '../plugins/dotnet';

gulp.task('serve:api:watch', () => serveApi({ watch: true }).then(openBrowser));

gulp.task('serve:api', () => serveApi().then(openBrowser));

gulp.task('serve', gulp.series([
  'build',
  'serve:api'
]));
