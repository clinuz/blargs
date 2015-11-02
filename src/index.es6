'use strict';

import { parse, parseString } from './parser';

export default function (args) {
	args = args || process.argv.slice(2);
	if (typeof args == 'string') args = parseString(args);
	if (!args.length) return [{}, null, null];
	return parse(args);
}