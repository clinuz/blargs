#!/usr/bin/env node
'use strict';

import blargs from '../';
import util from 'util';

function exec (args) {
	console.log(util.inspect(blargs(args), null, 10));
}

if (process.argv.length < 3) {
	let stdin = process.stdin;
	let data = '';
	stdin.setEncoding('utf8');
	stdin.resume();
	stdin.on('data', d => { data += d });
	stdin.on('end', () => { exec(data.trim()); });
} else exec();