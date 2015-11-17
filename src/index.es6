'use strict';

import { default as parse, parseString, Symbols } from './parser';

export default function blargs (args) {
	args = args || process.argv.slice(2);
	if (typeof args == 'string') args = parseString(args);
	if (!args.length) return Object.defineProperty([{}, null, null], Symbols.BLARGS, {value: true});
	return parse(args);
}