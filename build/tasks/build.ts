import * as gulp from 'gulp';
import * as webpack from 'webpack';
import { build as buildDotNet } from '../plugins/dotnet';
import { config as webpackConfig } from '../wpconfig';

function buildWebpack(watch: boolean): Promise<void> {
  const config = Object.assign(webpackConfig, { watch });

  return new Promise<void>((resolve, reject) =>
    webpack(config, (error: Error, stats: webpack.compiler.Stats) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    })
  );
}

gulp.task('build:dotnet', buildDotNet);

gulp.task('build:webpack', () => buildWebpack(false));

gulp.task('build:webpack:watch', () => buildWebpack(true));

gulp.task('build', gulp.series([
  'clean',
  gulp.parallel([
    'build:webpack',
    'build:dotnet'
  ])
]));

gulp.task('build:watch', gulp.series([
  'clean',
  gulp.parallel([
    'build:webpack:watch',
    'build:dotnet'
  ])
]));
