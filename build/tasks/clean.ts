import { cleanPaths } from '../config';
import * as del from 'del';
import * as gulp from 'gulp';

gulp.task('clean', () => del(cleanPaths));
