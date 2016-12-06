import 'font-awesome/css/font-awesome.css';
import 'bootstrap/dist/css/bootstrap.css';
import '../styles/styles.css';

import 'bootstrap';
import { Aurelia, LogManager } from 'aurelia-framework';
import { logLevel } from 'aurelia-logging';
import { ConsoleAppender } from 'aurelia-logging-console';

import * as Bluebird from 'bluebird';
Bluebird.config({ warnings: false });

const ENV = window.ENV || 'development';
LogManager.addAppender(new ConsoleAppender());
LogManager.setLevel(ENV === 'production' ? logLevel.warn : logLevel.debug);

export async function configure(aurelia: Aurelia) {
    aurelia.use.standardConfiguration();

    await aurelia.start();
    aurelia.setRoot('app');
}
