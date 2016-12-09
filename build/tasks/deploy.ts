import * as gulp from 'gulp';
import { FtpDeploy } from '../plugins/ftp-deploy';
import { logger } from '../plugins/logger';
import { ftpCleanPaths, ftpHost, ftpPassword, ftpRoot, ftpUser, publishDir } from '../config';

function ftpDeploy(): NodeJS.ReadWriteStream {
  const ftp = new FtpDeploy(ftpRoot, publishDir, {
    host: ftpHost,
    user: ftpUser,
    password: ftpPassword,
    log: logger.info.bind(logger)
  });

  return ftp.src()
    .pipe(ftp.clean(ftpCleanPaths))
    .pipe(ftp.dest());
}

gulp.task('deploy', gulp.series([
  'publish',
  ftpDeploy
]));
