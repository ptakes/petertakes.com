import { cleanPaths, globPaths } from '../config';
import * as del from 'del';
import * as gulp from 'gulp';

gulp.task('clean:glob', () => del(cleanPaths.concat(globPaths)));

gulp.task('clean', () => del(cleanPaths));
