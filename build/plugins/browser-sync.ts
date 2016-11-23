import * as Promise from 'bluebird';
import * as open from 'opn';
import { BrowserSyncInstance, Options as BrowserSyncOptions, create as createBrowserSync } from 'browser-sync';
import { logger } from './logger';
import { browserApp, proxyPort, proxyUIPort, serverUrl } from '../config';

interface BrowserSync extends BrowserSyncInstance {
  options: any;
}

const browserSync: BrowserSyncInstance = createBrowserSync();
const browserSyncInit = Promise.promisify<BrowserSyncInstance, BrowserSyncOptions>(browserSync.init, { context: browserSync });

function reportUrls(serverUrl: string, bs: BrowserSync): void {
  const urls = bs.options.get('urls').toJS();
  logger.info(`[BrowserSync] Proxying: {cyan:${serverUrl}}`);
  logger.info(`[BrowserSync]    Local: {cyan:${urls.local}}`);
  logger.info(`[BrowserSync]       UI: {cyan:${urls.ui}}`);
}

export function openBrowser(): Promise<BrowserSyncInstance> {
  return browserSyncInit({
    logLevel: 'silent',
    online: false,
    open: false,
    port: proxyPort,
    ui: {
      port: proxyUIPort
    },
    proxy: serverUrl,
    middleware: (request, response, next) => {
      response.setHeader('Access-Control-Allow-Origin', '*');
      next();
    }
  })
    .then((bs: BrowserSync) => {
      reportUrls(serverUrl, bs);
      open(bs.options.getIn(['urls', 'local']), { app: browserApp, wait: false });
      return bs;
    });
}

export function reloadBrowser(): Promise<BrowserSyncInstance> {
  browserSync.reload();
  return Promise.resolve(browserSync);
}
