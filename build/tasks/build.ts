import * as gulp from 'gulp';
import { build as buildDotNet } from '../plugins/dotnet';

gulp.task('build:dotnet', buildDotNet);

gulp.task('build', gulp.series([
  'build:dotnet'
]));
