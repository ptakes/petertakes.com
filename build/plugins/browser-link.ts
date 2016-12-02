import { async, await } from 'asyncawait';
import { BrowserSyncInstance as BrowserSync, Options as BrowserSyncOptions, create as createBrowserSync } from 'browser-sync';
import * as open from 'opn';
import { browserApp, proxyPort, proxyUIPort, serverUrl } from '../config';
import { logger } from './logger';

declare module 'browser-sync' {
  interface BrowserSyncInstance {
    options: any;
  }
}

const browserSyncInstance = createBrowserSync();

function initBrowserSync(options: BrowserSyncOptions): Promise<BrowserSync> {
  return new Promise<BrowserSync>((resolve, reject) =>
    browserSyncInstance.init(options,
      (error, browerSync) => error ? reject(error) : resolve(<BrowserSync>browerSync)));
}

function reportUrls(serverUrl: string, browserSync: BrowserSync): void {
  const { local: localUrl, ui: uiUrl } = browserSync.options.get('urls').toJS();
  logger.info(`[BrowserSync] Proxying: {cyan:${serverUrl}}`);
  logger.info(`[BrowserSync]    Local: {cyan:${localUrl}}`);
  logger.info(`[BrowserSync]       UI: {cyan:${uiUrl}}`);
}

export const openBrowser = async(() => {
  const browserSync = await(initBrowserSync({
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
  }));

  reportUrls(serverUrl, browserSync);
  open(browserSync.options.getIn(['urls', 'local']), { app: browserApp, wait: false });

  return browserSync;
});

export const reloadBrowser = () => {
  browserSyncInstance.reload();
  return Promise.resolve(browserSyncInstance);
};
