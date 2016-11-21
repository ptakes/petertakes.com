import { TASKS_DIR } from './build/config';
import * as gulp from 'gulp';
import * as help from 'gulp-help-four';
import * as requireDir from 'require-dir';

requireDir(TASKS_DIR);
help(gulp);
