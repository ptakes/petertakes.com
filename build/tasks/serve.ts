import * as gulp from 'gulp';
import { serve as serveApi } from '../plugins/dotnet';

gulp.task('serve:api', serveApi);

gulp.task('serve', gulp.series([
  'build',
  'serve:api'
]));
