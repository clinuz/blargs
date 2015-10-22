'use strict';

import Arguments from './Arguments';

let stack;
let nexts;

function context () {
	return stack[0];
}

export default {
	/*
	*/
	reset () {
		stack = [new Arguments()];
	},

	/*
	*/
	push () {
		let ret = new Arguments();
		stack.unshift(ret);
		return ret;
	},

	/*
	*/
	pop () {
		return stack.shift();
	},

	/*
	*/
	next (noadd) {
		if (nexts) {
			let next = this.pop();
			nexts.pop();
			let ctx = context();
			if (!ctx['--']) ctx['--'] = [];
			ctx['--'].push(next);
		} else {
			nexts = [];
		}
		if (!noadd) nexts.push(this.push());
	},

	/*
	*/
	end () {
		let ret;
		while (stack.length > 1) (nexts ? this.next(true) : stack.shift());
		ret = stack.shift();
		return ret;
	},

	/*
	*/
	positional (value) {
		if (value === undefined) return;
		context().$.push(value);
	},

	/*
	*/
	boolean (name, value) {
		context()[name] = value;
	},

	/*
	*/
	assign (name, value) {
		if (value === undefined) return;
		context()[name] = value;
	}
};