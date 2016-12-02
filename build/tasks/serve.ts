import * as gulp from 'gulp';
import { openBrowser } from '../plugins/browser-link';
import { serve as serveDotNet } from '../plugins/dotnet';

gulp.task('serve:dotnet', () => serveDotNet().then(openBrowser));

gulp.task('serve:dotnet:watch', () => serveDotNet({ watch: true }).then(openBrowser));

gulp.task('serve', gulp.series([
  'build',
  'serve:dotnet'
]));
