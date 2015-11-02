#!/usr/bin/env node
'use strict';

import blargs from '../';
import util from 'util';

console.log(util.inspect(blargs(process.argv.slice(2)), null, 10));