import 'font-awesome/css/font-awesome.css';
import 'bootstrap/dist/css/bootstrap.css';
import '../styles/styles.css';

import 'bootstrap';
import { Aurelia, LogManager } from 'aurelia-framework';
import { ConsoleAppender } from 'aurelia-logging-console';
import * as Bluebird from 'bluebird';

Bluebird.config({ warnings: false });

const loglevel = LogManager.logLevel[$('body').data('loglevel') || 'none'];
if (loglevel) {
  LogManager.addAppender(new ConsoleAppender());
  LogManager.setLevel(loglevel);
}

export async function configure(aurelia: Aurelia) {
    aurelia.use.standardConfiguration();

    await aurelia.start();
    aurelia.setRoot('app');
}
