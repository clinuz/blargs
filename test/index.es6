'use strict';

import { assert } from 'chai';
import blargs from '../';

suite('long-arguments', () => {
	test('boolean flags', () => {
		let [ args ] = blargs('--one --two --three');
		assert.isTrue(args.one);
		assert.isTrue(args.two);
		assert.isTrue(args.three);
	});
	test('negative boolean flags', () => {
		let [ args ] = blargs('--no-one --no-two --no-three');
		assert.isFalse(args.one);
		assert.isFalse(args.two);
		assert.isFalse(args.three);
	});
	test('long-name boolean flags', () => {
		let [ args ] = blargs('--one-thing --two-things');
		assert.isTrue(args['one-thing']);
		assert.isTrue(args['two-things']);
	});
	test('long-name negative boolean flags', () => {
		let [ args ] = blargs('--no-one-thing --no-two-things');
		assert.isFalse(args['one-thing']);
		assert.isFalse(args['two-things']);
	});
	test('assignment', () => {
		let [ args ] = blargs('--one=two --two="three four" --three=val,val,val');
		assert.equal(args.one, 'two');
		assert.equal(args.two, 'three four');
		assert.equal(args.three, 'val,val,val');
	});
	test('complex values', () => {
		let [ args ] = blargs('--one=~`!@#$%^&*()-_+=:;{}[]123|\\/?456<>abcdef,.')
		assert.equal(args.one, '~`!@#$%^&*()-_+=:;{}[]123|\\/?456<>abcdef,.');
	});
});

suite('short-arguments', () => {
	test('boolean flags', () => {
		let [ args ] = blargs('-o -n -e');
		assert.isTrue(args.o);
		assert.isTrue(args.n);
		assert.isTrue(args.e);
	});
	test('multiple boolean flags', () => {
		let [ args ] = blargs('-one');
		assert.isTrue(args.o);
		assert.isTrue(args.n);
		assert.isTrue(args.e);
	});
	test('negative boolean flags', () => {
		let [ args ] = blargs('-no-o -no-n -no-e');
		assert.isFalse(args.o);
		assert.isFalse(args.n);
		assert.isFalse(args.e);
	});
	test('multiple negative boolean flags', () => {
		let [ args ] = blargs('-no-one');
		assert.isFalse(args.o);
		assert.isFalse(args.n);
		assert.isFalse(args.e);
	});
	test('assignment', () => {
		let [ args ] = blargs('-o two -n "three four" -e val,val,val');
		assert.equal(args.o, 'two');
		assert.equal(args.n, 'three four');
		assert.equal(args.e, 'val,val,val');
	});
	test('complex values', () => {
		let [ args ] = blargs('-o ~`!@#$%^&*()-_+=:;{}[]123|\\/?456<>abcdef,.')
		assert.equal(args.o, '~`!@#$%^&*()-_+=:;{}[]123|\\/?456<>abcdef,.');
	});
});

suite('positional arguments', () => {
	test('single positional argument', () => {
		let [ args, pos ] = blargs('argument');
		assert(Array.isArray(pos));
		assert(pos.length === 1);
		assert.equal(pos[0], 'argument');
	});
	test('multiple positional arguments', () => {
		let [ args, pos ] = blargs('argument1 argument2 argument3');
		assert(Array.isArray(pos));
		assert(pos.length === 3);
		assert.equal(pos[0], 'argument1');
		assert.equal(pos[1], 'argument2');
		assert.equal(pos[2], 'argument3');
	});
});

suite('subargs', () => {
	test('spaces, no positionals', () => {
		let [ args ] = blargs('-t [ -n -e --long=short ]');
		assert(Array.isArray(args.t));
		let [ targs ] = args.t;
		assert.isTrue(targs.n);
		assert.isTrue(targs.e);
		assert.equal(targs.long, 'short');
	});
	test('spaces, positionals', () => {
		let [ args ] = blargs('-t [ one -n -e --long=short two ]');
		assert(Array.isArray(args.t));
		let [ targs, tpos ] = args.t;
		assert.isTrue(targs.n);
		assert.isTrue(targs.e);
		assert.equal(targs.long, 'short');
		assert(Array.isArray(tpos));
		assert(tpos.length === 2);
		assert.equal(tpos[0], 'one');
		assert.equal(tpos[1], 'two');
	});
	test('no spaces, no positionals', () => {
		let [ args ] = blargs('-t [-n -e --long=short]');
		assert(Array.isArray(args.t));
		let [ targs ] = args.t;
		assert.isTrue(targs.n);
		assert.isTrue(targs.e);
		assert.equal(targs.long, 'short');
	});
	test('no spaces, positionals', () => {
		let [ args ] = blargs('-t [one -n -e --long=short two]');
		assert(Array.isArray(args.t));
		let [ targs, tpos ] = args.t;
		assert.isTrue(targs.n);
		assert.isTrue(targs.e);
		assert.equal(targs.long, 'short');
		assert(Array.isArray(tpos));
		assert(tpos.length === 2);
		assert.equal(tpos[0], 'one');
		assert.equal(tpos[1], 'two');
	});
	test('no spaces, end in assignment/value', () => {
		let [ args ] = blargs('-t [-new pos --long=short]');
		assert(Array.isArray(args.t));
		let [ targs, tpos ] = args.t;
		assert.isTrue(targs.n);
		assert.isTrue(targs.e);
		assert.isTrue(targs.w);
		assert(Array.isArray(tpos));
		assert(tpos.length === 1);
		assert.equal(tpos[0], 'pos');
		assert.equal(targs.long, 'short');
	});
	test('mixed spaces front, end in assignment/value', () => {
		let [ args ] = blargs('-t [ -new pos --long=short]');
		assert(Array.isArray(args.t));
		let [ targs, tpos ] = args.t;
		assert.isTrue(targs.n);
		assert.isTrue(targs.e);
		assert.isTrue(targs.w);
		assert(Array.isArray(tpos));
		assert(tpos.length === 1);
		assert.equal(tpos[0], 'pos');
		assert.equal(targs.long, 'short');
	});
	test('mixed spaces tail, end in assignment/value', () => {
		let [ args ] = blargs('-t [-new pos --long=short ]');
		assert(Array.isArray(args.t));
		let [ targs, tpos ] = args.t;
		assert.isTrue(targs.n);
		assert.isTrue(targs.e);
		assert.isTrue(targs.w);
		assert(Array.isArray(tpos));
		assert(tpos.length === 1);
		assert.equal(tpos[0], 'pos');
		assert.equal(targs.long, 'short');
	});
	test('sub-subargs depth 2', () => {
		let [ args ] = blargs('-z [ -Z [ -z ] ]');
		assert(Array.isArray(args.z));
		assert(Array.isArray(args.z[0].Z));
		assert.isTrue(args.z[0].Z[0].z);
	});
	test('sub-subargs depth 3', () => {
		let [ args ] = blargs('-z [ sub1 -Z [ sub2 -z [ sub3 -Z ] ] ]');
		assert(Array.isArray(args.z));
		assert(Array.isArray(args.z[0].Z));
		assert(Array.isArray(args.z[0].Z[0].z));
		assert.isTrue(args.z[0].Z[0].z[0].Z);
		assert.equal(args.z[1][0], 'sub1');
		assert.equal(args.z[0].Z[1][0], 'sub2');
		assert.equal(args.z[0].Z[0].z[1][0], 'sub3');
	});
});

suite('next-command arguments', () => {
	test('next-command depth 1', () => {
		let [ args, pos, next ] = blargs('arg1 -- arg2 -x');
		assert(Object.keys(args).length === 0);
		assert.equal(pos[0], 'arg1');
		assert(next);
		[ args, pos ] = next;
		assert.equal(pos[0], 'arg2');
		assert.isTrue(args.x);
	});
	test('next-command depth 2', () => {
		let [ args, pos, next ] = blargs('arg1 -- arg2 -x -- arg3 --end');
		assert(Object.keys(args).length === 0);
		assert.equal(pos[0], 'arg1');
		assert(next);
		[ args, pos, next ] = next;
		assert.equal(pos[0], 'arg2');
		assert.isTrue(args.x);
		assert(next);
		[ args, pos ] = next;
		assert.isTrue(args.end);
		assert.equal(pos[0], 'arg3');
	});
});

suite('error recovery', () => {
	test('short-argument with = assignment', () => {
		let [ args ] = blargs('-Z=two');
		assert.equal(args.Z, 'two');
	});
	test('dangling subargs', () => {
		let [ args ] = blargs('-Z [ -z pos');
		assert(Array.isArray(args.Z));
		assert.equal(args.Z[0].z, 'pos');
	});
	test('dangling double quotes', () => {
		let [ args ] = blargs('-Z "value');
		assert.equal(args.Z, 'value');
	});
	test('dangling single quotes', () => {
		let [ args ] = blargs('-Z \'value');
		assert.equal(args.Z, 'value');
	});
	test('dangling double quote for quoted positional', () => {
		let [ args, pos ] = blargs('"value""');
		assert(pos.length === 1);
		assert.equal(pos[0], 'value');
	});
	test('dangling single quote for quoted positional', () => {
		let [ args, pos ] = blargs('\'value\'\'');
		assert(pos.length === 1);
		assert.equal(pos[0], 'value');
	});
});

suite('mixed cases', () => {
	test('next-arguments and subargs', () => {
		let [ args,, next ] = blargs('-Z [ sub1 -x ] -- next1 -Z [ sub2 -no-x ]');
		assert.deepEqual(args, {
			Z: [
				{x: true},
				['sub1'],
				null
			]
		});
		assert.deepEqual(next, [
			{
				Z: [
					{x: false},
					['sub2'],
					null
				]
			},
			['next1'],
			null
		]);
	});
	test('next-arguments in subargs', () => {
		let [ args, pos, next ] = blargs('-Z [-- next -z]');
		assert(args);
		assert(args.Z);
		[ args, pos, next ] = args.Z;
		[ args, pos, next ] = next;
		assert(pos);
		assert.equal(pos[0], 'next');
		assert(args);
		assert.isTrue(args.z);
	});
	test('multiples of same arguments', () => {
		let [ args ] = blargs('-z -z -no-z');
		assert(args);
		assert(Array.isArray(args.z));
		assert.deepEqual(args.z, [true,true,false]);
	});
	test('convert false/true string to boolean', () => {
		let [ args ] = blargs('-a true -b false --t1=true --t2=false');
		assert.isTrue(args.a);
		assert.isTrue(args.t1);
		assert.isFalse(args.b);
		assert.isFalse(args.t2);
	});
	test('next-arguments in subargs and after (testing recursion)', () => {
		let [ args, pos, next ] = blargs('--arg=[ arg -- -abc --arg ] -- -abc --arg');
		assert.deepEqual(args, {
			arg: [
				{},
				['arg'],
				[
					{a: true, b: true, c: true, arg: true},
					null,
					null
				]
			]
		});
		assert(pos === null);
		assert.deepEqual(next, [
			{a: true, b: true, c: true, arg: true},
			null,
			null
		]);
	});
});