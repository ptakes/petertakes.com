import 'font-awesome/css/font-awesome.css';
import 'bootstrap/dist/css/bootstrap.css';
import '../styles/styles.css';

import * as Bluebird from 'bluebird';
Bluebird.config({ warnings: false });

import 'bootstrap';
import { Aurelia, LogManager } from 'aurelia-framework';
import { logLevel } from 'aurelia-logging';
import { ConsoleAppender } from 'aurelia-logging-console';
import { FeatureConfiguration } from './feature';

const ENV = window.ENV || 'development';
LogManager.addAppender(new ConsoleAppender());
LogManager.setLevel(ENV === 'production' ? logLevel.warn : logLevel.debug);

export async function configure(aurelia: Aurelia): Promise<void> {
  const featureConfiguration = aurelia.container.get(FeatureConfiguration);

  aurelia.use
    .standardConfiguration()
    .feature('resources', featureConfiguration)
    .feature('home', featureConfiguration)
    .feature('users', featureConfiguration);

  await aurelia.start();
  aurelia.setRoot('shell/shell');
}
