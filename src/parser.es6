'use strict';

/*
Because we allow mulitple short-hand booleans to be defined we cannot allow short-hand assignment
without a space. This will allow context free parsing for this scenario with the greatest amount
of freedom to cover both scenarios. It also will support short-hand assignment with equal-sign even
though it probably shouldn't.

A positional argument following a short-hand argument will be assumed to be an assignment. This
merely means that the positional argument should be placed ahead of the boolean short-hand argument
to achieve the intended outcome without needing to know context.
*/

//
let short          = /^-[^\-\s]/;
let shortmulti     = /^-[^\-\s]{2,}$/;
let shortassign    = /^-[^\-\s]=/;
let shortassignsub = /^-[^\-\s]=\[/;
let long           = /^--\S/;
let longassign     = /^--[^=\s]+=(?!\[)/;
let longassignsub  = /^--(?!no)[^=\s]+=\[/;
let subclosed      = /\](?:\s*)$/;
let noshort        = /^-no-\S$/;
let noshortmulti   = /^-no-\S{2,}$/;
let nolong         = /^--no-\S+$/;
let subopen        = /^\[/;
let subclose       = /^\]$/;
let nextexpr        = /^--\s*$/;

const Types = {
	SHORT         : Symbol('SHORT'),
	SHORTASSIGN   : Symbol('SHORTASSIGN'),
	SHORTASSIGNSUB: Symbol('SHORTASSIGNSUB'),
	SHORTMULTI    : Symbol('SHORTMULTI'),
	SHORTNO       : Symbol('SHORTNO'),
	SHORTNOMULTI  : Symbol('SHORTNOMULTI'),
	LONG          : Symbol('LONG'),
	LONGASSIGN    : Symbol('LONGASSIGN'),
	LONGASSIGNSUB : Symbol('LONGASSIGNSUB'),
	LONGNO        : Symbol('LONGNO'),
	POSITIONAL    : Symbol('POSITIONAL'),
	NEXTEXPR      : Symbol('NEXTEXPR'),
	UNKNOWN       : Symbol('UNKNOWN')
};

const debug = false;

function log (...args) {
	if (debug) console.log(...args);
}

function scanSubargs (args) {
	let subs = [], arg;
	for (;;) {
		arg = args.shift();
		if (arg !== undefined) {
			if (subclose.test(arg)) break;
			else if (subclosed.test(arg)) {
				subs.push(arg.trim().slice(0, -1));
				break;
			} else {
				subs.push(arg);
			}
		} else break;
	}
	return subs;
}

export default function parse (args) {

	let assigned = {};
	let positionals = [];
	let nextexprs = null;

	for (;;) {
	
		let arg = args.shift();
		let type, next, nexttype, i;
		
		if (arg == null) break;

		type = typeOf(arg);
		
		// @todo a more intelligent system to not waste work like this
		switch (type) {
		
		case Types.SHORT:
			// since a short can be an assignment with a space, we peek ahead to
			// determine if the next argument if any is a value
			nexttype = typeOf(args[0]);
			if (nexttype == Types.POSITIONAL) {
				next = args.shift();
				if (subopen.test(next)) {
					// convoluted case where there was a space and an open sub argument expression
					if (next == '[') next = scanSubargs(args);
					else {
						args.unshift(next.slice(1));
						next = scanSubargs(args);
					}
					assigned[arg[1]] = parse(next);
				} else assigned[arg[1]] = next;
			} else {
				assigned[arg[1]] = true;
			}
			break;
		case Types.SHORTASSIGN:
			// the value being assigned should be included
			[ arg, next ] = assignments(arg.slice(1));
			assigned[arg] = next;
			break;
		case Types.SHORTASSIGNSUB:
			[ arg, next ] = assignments(arg.slice(1));
			if (next == '[') next = scanSubargs(args);
			else {
				args.unshift(next.slice(1));
				next = scanSubargs(args);
			}
			assigned[arg] = parse(next);
			break;
		case Types.SHORTMULTI:
			// each of these will be boolean true values
			for (i = 1; i < arg.length; ++i) assigned[arg[i]] = true;
			break;
		case Types.SHORTNOMULTI:
			// each of these will be boolean false values
			for (i = 4; i < arg.length; ++i) assigned[arg[i]] = false;
			break;
		case Types.SHORTNO:
			// will be boolean false
			assigned[arg[4]] = false;
			break;
		case Types.LONG:
			assigned[arg.slice(2)] = true;
			break;
		case Types.LONGASSIGNSUB:
			[ arg, next ] = assignments(arg.slice(2));
			if (next == '[') next = scanSubargs(args);
			else {
				args.unshift(next.slice(1));
				next = scanSubargs(args);
			}
			assigned[arg] = parse(next);
			break;
		case Types.LONGASSIGN:
			[ arg, next ] = assignments(arg.slice(2));
			assigned[arg] = next;
			break;
		case Types.LONGNO:
			assigned[arg.slice(5)] = false;
			break;
		case Types.NEXTEXPR:
			nextexprs = parse(args);
			break;
		case Types.POSITIONAL:
		case Types.UNKNOWN:
			positionals.push(arg);
			break;
		}
	
	}

	return [
		assigned,
		positionals.length ? positionals : null,
		nextexprs
	];
}

function typeOf (arg) {
	let type;
	if (arg && arg.charAt(0) == '-') {
		if (short.test(arg)) {
			if (noshortmulti.test(arg))        type = Types.SHORTNOMULTI;
			else if (noshort.test(arg))        type = Types.SHORTNO;
			else if (shortassignsub.test(arg)) type = Types.SHORTASSIGNSUB;
			else if (shortassign.test(arg))    type = Types.SHORTASSIGN;
			else if (shortmulti.test(arg))     type = Types.SHORTMULTI;
			else                               type = Types.SHORT;
		} else if (long.test(arg)) {
			if (nolong.test(arg))              type = Types.LONGNO;
			else if (longassignsub.test(arg))  type = Types.LONGASSIGNSUB;
			else if (longassign.test(arg))     type = Types.LONGASSIGN;
			else                               type = Types.LONG;
		} else if (nextexpr.test(arg))         type = Types.NEXTEXPR;
		else                                   type = Types.UNKNOWN;
	} else if (arg)                            type = Types.POSITIONAL;
	else                                       type = Types.UNKNOWN;
	log('typeOf', arg, type);
	return type;
}

function assignments (arg) {
	let idx = arg.indexOf('=');
	return [arg.slice(0, idx), arg.slice(idx + 1)];
}

function parseString (str) {
	if (typeof str != 'string' || !str) return [];

	let args = [];
	let input = str.split('');
	let arg = '';
	for (;;) {
		let ch = input.shift();
		if (ch == null) break;
		if (ch != ' ') {
			if (ch == '"') {
				for (;;) {
					ch = input.shift();
					if (ch == null) break;
					else if (ch == '"' && (!arg || (arg && arg[arg.length - 1] != '\\'))) break;
					else arg += ch;
				}
				if (arg.length) {
					args.push(arg);
					arg = '';
				}
			} else if (ch == '\'') {
				for (;;) {
					ch = input.shift();
					if (ch == null) break;
					else if (ch == '\'' && (!arg || (arg && arg[arg.length - 1] != '\\'))) break;
					else arg += ch;
				}
				if (arg.length) {
					args.push(arg);
					arg = '';
				}
			} else arg += ch;
		} else {
			args.push(arg);
			arg = '';
		}
	}
	if (arg.length) args.push(arg);
	
	return args;
}

export { parseString };