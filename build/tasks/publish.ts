import * as gulp from 'gulp';
import { publish as publishDotNet } from '../plugins/dotnet';

gulp.task('publish:dotnet', publishDotNet);

gulp.task('publish', gulp.series([
  'publish:dotnet'
]));
