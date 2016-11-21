import * as gulp from 'gulp';
import * as help from 'gulp-help-four';
import * as requireDir from 'require-dir';

requireDir('./build/tasks');
help(gulp);
