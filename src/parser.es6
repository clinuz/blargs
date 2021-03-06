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

const Symbols = {
	BLARGS        : Symbol('BLARGS')
};

const debug = false;

function log (...args) {
	if (debug) console.log(...args);
}

function assign (target, key, value) {
	let exst = target[key];
	value = checkValue(value);
	if (exst) {
		if (!Array.isArray(exst) || exst[Symbols.BLARGS] === true) exst = target[key] = [exst];
		exst.push(value);
	} else target[key] = value;
}

function checkValue (value) {
	if (value == 'true') return true;
	else if (value == 'false') return false;
	else return value;
}

export default function parse (args, recursing) {

	// for sanity, if somehow an array gets passed in that is a result of a prior parse attempt
	// simply return it as-is
	if (Array.isArray(args) && args[Symbols.BLARGS] === true) return args;
	if (!recursing) args = sanitize(args);

	let assigned = {};
	let positionals = [];
	let nextexprs = null;

	if (recursing) log('parse() recursing', args.length);

	for (;;) {
	
		let arg = args.shift();
		let type, next, nexttype, i, end;
		
		if (arg == null) break;

		if (recursing) {
			if (subclose.test(arg)) {
				log('parse() found tail subargs bracket, ending', arg);
				break;
			} else if (subclosed.test(arg)) {
				log('parse() found tail subargs bracket in argument, will end', arg);
				end = true;
				arg = arg.trim().slice(0, -1);
			}
		}
		
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
					if (next == '[') next = parse(args, true);
					else {
						args.unshift(next.slice(1));
						next = parse(args, true);
					}
					assign(assigned, arg[1], next);
				// special case since we do lookahead here we want to make sure we interpret
				// subargs end bracket correctly
				} else if (recursing && subclose.test(next)) {
					// we can ignore it but the short that we found must be assigned as flag
					assign(assigned, arg[1], true);
					end = true;
				} else if (recursing && subclosed.test(next)) {
					end = true;
					assign(assigned, arg[1], next.trim().slice(0, -1));
				} else assign(assigned, arg[1], next);
			} else {
				assign(assigned, arg[1], true);
			}
			break;
		case Types.SHORTASSIGN:
			// the value being assigned should be included
			[ arg, next ] = assignments(arg.slice(1));
			assign(assigned, arg, next);
			break;
		case Types.SHORTASSIGNSUB:
			[ arg, next ] = assignments(arg.slice(1));
			if (next == '[') next = parse(args, true);
			else {
				args.unshift(next.slice(1));
				next = parse(args, true);
			}
			assign(assigned, arg, next);
			break;
		case Types.SHORTMULTI:
			// each of these will be boolean true values
			for (i = 1; i < arg.length; ++i) assign(assigned, arg[i], true);
			break;
		case Types.SHORTNOMULTI:
			// each of these will be boolean false values
			for (i = 4; i < arg.length; ++i) assign(assigned, arg[i], false);
			break;
		case Types.SHORTNO:
			// will be boolean false
			assign(assigned, arg[4], false);
			break;
		case Types.LONG:
			assign(assigned, arg.slice(2), true);
			break;
		case Types.LONGASSIGNSUB:
			[ arg, next ] = assignments(arg.slice(2));
			if (next == '[') next = parse(args, true);
			else {
				args.unshift(next.slice(1));
				next = parse(args, true);
			}
			assign(assigned, arg, next);
			break;
		case Types.LONGASSIGN:
			[ arg, next ] = assignments(arg.slice(2));
			assign(assigned, arg, next);
			break;
		case Types.LONGNO:
			assign(assigned, arg.slice(5), false);
			break;
		case Types.NEXTEXPR:
			nextexprs = parse(args, recursing);
			end = true;
			break;
		case Types.POSITIONAL:
		case Types.UNKNOWN:
			positionals.push(arg);
			break;
		}
		if (end) {
			log('parse() ending marker, breaking loop');
			break;
		}
	}

	log('parse() returning');
	let result = [
		assigned,
		positionals.length ? positionals : null,
		nextexprs
	];
	// we mark the array as having been a parsed-value-return as there are circumstances where
	// this makes determining what type of array it is easier
	// note that the better solution would have been to change the return type but that has more
	// potential drawbacks by breaking compatibility, this should have no impact as it is a
	// symbol you have to be looking for and is not enumerable
	Object.defineProperty(result, Symbols.BLARGS, {value: true});
	Object.freeze(result);
	return result;
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

function sanitize (args) {
	let sane = [];
	// because of the way the arguments will have been parsed it is possible to have really
	// tricky scenarios with the lookahead, so, for convenience, we attempt to avoid those
	// scenarios by splitting arguments where necessary
	for (let i = 0; i < args.length; ++i) {
		let arg = args[i];
		if (/\]{2,}/g.test(arg)) {
			let p = arg.indexOf(']');
			if (p === 0) {
				sane.push(']');
				p++;
			} else sane.push(arg.slice(0, p));
			for (; p < arg.length; ++p) {
				if (arg[p] == ']') {
					sane.push(']');
				}
				else break;
			}
			if (p < arg.length - 1) {
				sane.push(arg.slice(p));
			}
		} else {
			sane.push(arg);
		}
	}
	return sane;
}

export { parseString, Symbols };