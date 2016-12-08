// https://github.com/aurelia/framework/blob/master/doc/article/drafts/Aurelia%20Project%20Structure.md.md
import 'font-awesome/css/font-awesome.css';
import 'bootstrap/dist/css/bootstrap.css';
import '../styles/styles.css';

import * as Bluebird from 'bluebird';
Bluebird.config({ warnings: false });

import 'bootstrap';
import { Aurelia, LogManager } from 'aurelia-framework';
import { logLevel } from 'aurelia-logging';
import { ConsoleAppender } from 'aurelia-logging-console';

const ENV = window.ENV || 'development';
LogManager.addAppender(new ConsoleAppender());
LogManager.setLevel(ENV === 'production' ? logLevel.warn : logLevel.debug);

export async function configure(aurelia: Aurelia): Promise<void> {
    aurelia.use
        .standardConfiguration()
        .feature('resources');

    await aurelia.start();
    aurelia.setRoot('shell/shell');
}
