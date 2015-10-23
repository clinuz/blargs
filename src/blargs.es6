#!/usr/bin/env node
'use strict';

import blarg from '../';
import util from 'util';

console.log(util.inspect(blarg(process.argv.slice(2)), null, 10));