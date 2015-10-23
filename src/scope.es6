'use strict';

let stack;
let nexts;

function context () {
	return stack[0];
}

export default {
	/*
	*/
	reset () {
		stack = [[{},undefined,undefined]];
		nexts = null;
	},

	/*
	*/
	push () {
		let ret = [{},undefined,undefined];
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
			let seq = ctx[2];
			if (!seq) seq = ctx[2] = [];
			seq.push(next);
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
		let ctx = context();
		let pos = ctx[1];
		if (!pos) pos = ctx[1] = [];
		pos.push(value);
	},

	/*
	*/
	boolean (name, value) {
		context()[0][name] = value;
	},

	/*
	*/
	assign (name, value) {
		if (value === undefined) return;
		context()[0][name] = value;
	}
};