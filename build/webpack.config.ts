import * as aurelia from '@easy-webpack/config-aurelia';
import * as commonChunksOptimize from '@easy-webpack/config-common-chunks-simple';
import * as copyFiles from '@easy-webpack/config-copy-files';
import { generateConfig, stripMetadata } from '@easy-webpack/core';
import * as css from '@easy-webpack/config-css';
import * as envProduction from '@easy-webpack/config-env-production';
import * as envDevelopment from '@easy-webpack/config-env-development';
import * as fontAndImages from '@easy-webpack/config-fonts-and-images';
import * as generateIndexHtml from '@easy-webpack/config-generate-index-html';
import * as globalBluebird from '@easy-webpack/config-global-bluebird';
import * as globalJquery from '@easy-webpack/config-global-jquery';
import * as globalRegenerator from '@easy-webpack/config-global-regenerator';
import * as html from '@easy-webpack/config-html';
import * as typescript from '@easy-webpack/config-typescript';
import * as uglify from '@easy-webpack/config-uglify';
import * as cssnano from 'cssnano';
import * as cssnext from 'postcss-cssnext';
import { Configuration } from 'webpack';
import { ENV, appMain, appName, baseUrl, rootDir, sourceDir, webDir } from './project.config';

const coreBundles = {
  bootstrap: [
    'aurelia-bootstrapper-webpack',
    'aurelia-polyfills',
    'aurelia-pal',
    'aurelia-pal-browser',
    'bluebird'
  ],
  aurelia: [
    'aurelia-bootstrapper-webpack',
    'aurelia-binding',
    'aurelia-dependency-injection',
    'aurelia-event-aggregator',
    'aurelia-framework',
    'aurelia-history',
    'aurelia-history-browser',
    'aurelia-loader',
    'aurelia-loader-webpack',
    'aurelia-logging',
    'aurelia-logging-console',
    'aurelia-metadata',
    'aurelia-pal',
    'aurelia-pal-browser',
    'aurelia-path',
    'aurelia-polyfills',
    'aurelia-route-recognizer',
    'aurelia-router',
    'aurelia-task-queue',
    'aurelia-templating',
    'aurelia-templating-binding',
    'aurelia-templating-router',
    'aurelia-templating-resources'
  ]
};

const envLoaderOptions: any = {};
const additionalCssLoaders: string[] = [];
if (ENV === 'production') {
  additionalCssLoaders.push('postcss-loader');
  envLoaderOptions.postcss = [
    cssnext(),
    cssnano({ autoprefixer: false, safe: true })
  ];
}

const typescriptOptions = {
  useCache: true,
  useBabel: true,
  babelOptions: {
    presets: ['latest'],
    plugins: ['transform-class-properties', 'transform-regenerator']
  }
};

const easyConfig = generateConfig(
  {
    entry: {
      'app': [appMain],
      'aurelia-bootstrap': coreBundles.bootstrap,
      'aurelia': coreBundles.aurelia.filter(pkg => coreBundles.bootstrap.indexOf(pkg) === -1)
    },
    metadata: {
      ENV
    },
    output: {
      path: webDir,
    }
  },
  ENV === 'production' ? envProduction({ loaderOptions: envLoaderOptions }) : envDevelopment(),
  aurelia({ root: rootDir, src: sourceDir, title: appName, baseUrl: baseUrl }),
  typescript({ options: typescriptOptions }),
  html(),
  css({ filename: 'styles.css', allChunks: true, sourceMap: false, additionalLoaders: additionalCssLoaders }),
  fontAndImages(),
  globalBluebird(),
  globalJquery(),
  globalRegenerator(),
  generateIndexHtml({ minify: ENV === 'production' }),
  commonChunksOptimize({ appChunkName: 'app', firstChunk: 'aurelia-bootstrap' }),
  copyFiles({ patterns: [{ from: 'favicon.ico', to: 'favicon.ico' }] }),
  ENV === 'production' ? uglify({ debug: false, mangle: { except: ['cb', '__webpack_require__'] } }) : {}
);

export const config = <Configuration>stripMetadata(easyConfig);
