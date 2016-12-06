import * as gulp from 'gulp';
import * as help from 'gulp-help-four';

// Order of import matters.
import './build/tasks/clean';
import './build/tasks/build';
import './build/tasks/test';
import './build/tasks/e2e';
import './build/tasks/serve';
import './build/tasks/watch';
import './build/tasks/publish';
import './build/tasks/deploy';

help(gulp);
