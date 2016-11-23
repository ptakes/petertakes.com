import * as gulp from 'gulp';
import { serve as serveDotNet } from '../plugins/dotnet';

gulp.task('serve:dotnet', serveDotNet);

gulp.task('serve', gulp.series([
  'build',
  'serve:dotnet'
]));
