import { cleanPaths, globPaths } from '../config';
import * as del from 'del';
import * as gulp from 'gulp';

gulp.task('clean', () => del(cleanPaths));

gulp.task('clean:glob', gulp.parallel([
  'clean',
  () => del(globPaths)
]));
