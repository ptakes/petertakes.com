import * as gulp from 'gulp';
import * as help from 'gulp-help-four';
import * as requireDir from 'require-dir';
import { tasksDir } from './build/config';

requireDir(tasksDir);
help(gulp);
