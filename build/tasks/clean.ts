import { cleanPaths, globPaths, publishDir } from '../project.config';
import * as del from 'del';
import * as gulp from 'gulp';

gulp.task('clean:glob', () => del(cleanPaths.concat(globPaths)));

gulp.task('clean:publish', () => del(publishDir));

gulp.task('clean', () => del(cleanPaths));
