'use strict';

import { parser } from './parser';
import scope from './scope';
import Arguments from './Arguments';

export default function (args) {
	args = args || process.argv.slice(2);
	if (Array.isArray(args)) {
		if (!args.length) return new Arguments();
		args = recon(args);
	}
	parser.yy = scope;
	scope.reset();
	return parser.parse(args);
}

function recon (args) {
	return args.map(arg => {
		if (arg.indexOf('=') > -1) {
			let parts = arg.split('=');
			let val = parts[1];
			if (val[0] == '\'' || val[0] == '"') return arg;
			else if (val.indexOf(' ') > -1) val = `"${val.replace(/\"/g, '\"')}"`;
			parts[1] = val;
			return parts.join('=');
		} else if (arg.indexOf(' ') > -1) {
			return `"${arg.replace(/\"/g, '\"')}"`;
		} else return arg;
	}).join(' ');
}