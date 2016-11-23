import { cleanPaths, globPaths } from '../config';
import * as del from 'del';
import * as gulp from 'gulp';

function glob(): void {
  del(cleanPaths.concat(globPaths));
}

gulp.task('clean:glob', glob);

gulp.task('clean', () => del(cleanPaths));
