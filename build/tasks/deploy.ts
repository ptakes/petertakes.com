import * as gulp from 'gulp';
import { FtpDeploy } from '../plugins/ftp-deploy';
import { publish as publishDotNet } from '../plugins/dotnet';
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

gulp.task('publish:dotnet', publishDotNet);

gulp.task('publish', gulp.series([
  'clean:publish',
  'build',
  'publish:dotnet'
]));

gulp.task('deploy', gulp.series([
  'publish',
  ftpDeploy
]));
