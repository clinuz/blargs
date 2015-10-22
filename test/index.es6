'use strict';

import { assert } from 'chai';
import blarg from '../';

suite('long-arguments', () => {
	test('boolean flags', () => {
		let result = blarg('--one --two --three');
		assert.isTrue(result.one);
		assert.isTrue(result.two);
		assert.isTrue(result.three);
	});
	test('negative boolean flags', () => {
		let result = blarg('--no-one --no-two --no-three');
		assert.isFalse(result.one);
		assert.isFalse(result.two);
		assert.isFalse(result.three);
	});
	test('assignment', () => {
		let result = blarg('--one=two --two="three four" --three=val,val,val');
		assert.equal(result.one, 'two');
		assert.equal(result.two, 'three four');
		assert.equal(result.three, 'val,val,val');
	});
	test('complex values', () => {
		let result = blarg('--one=~`!@#$%^&*()-_+=:;{}[]123|\\/?456<>abcdef,.')
		assert.equal(result.one, '~`!@#$%^&*()-_+=:;{}[]123|\\/?456<>abcdef,.');
	});
});

suite('short-arguments', () => {
	test('boolean flags', () => {
		let result = blarg('-o -n -e');
		assert.isTrue(result.o);
		assert.isTrue(result.n);
		assert.isTrue(result.e);
	});
	test('multiple boolean flags', () => {
		let result = blarg('-one');
		assert.isTrue(result.o);
		assert.isTrue(result.n);
		assert.isTrue(result.e);
	});
	test('negative boolean flags', () => {
		let result = blarg('-no-o -no-n -no-e');
		assert.isFalse(result.o);
		assert.isFalse(result.n);
		assert.isFalse(result.e);
	});
	test('multiple negative boolean flags', () => {
		let result = blarg('-no-one');
		assert.isFalse(result.o);
		assert.isFalse(result.n);
		assert.isFalse(result.e);
	});
	test('assignment', () => {
		let result = blarg('-o two -n "three four" -e val,val,val');
		assert.equal(result.o, 'two');
		assert.equal(result.n, 'three four');
		assert.equal(result.e, 'val,val,val');
	});
	test('complex values', () => {
		let result = blarg('-o ~`!@#$%^&*()-_+=:;{}[]123|\\/?456<>abcdef,.')
		assert.equal(result.o, '~`!@#$%^&*()-_+=:;{}[]123|\\/?456<>abcdef,.');
	});
});

suite('positional arguments', () => {
	test('single positional argument', () => {
		let result = blarg('argument');
		assert(result.$.length === 1);
		assert.equal(result.$[0], 'argument');
	});
	test('multiple positional arguments', () => {
		let result = blarg('argument1 argument2 argument3');
		assert(result.$.length === 3);
		assert.equal(result.$[0], 'argument1');
		assert.equal(result.$[1], 'argument2');
		assert.equal(result.$[2], 'argument3');
	});
});

suite('subargs', () => {
	test('spaces, no positionals', () => {
		let result = blarg('-t [ -n -e --long=short ]');
		assert(typeof result.t == 'object');
		assert.isTrue(result.t.n);
		assert.isTrue(result.t.e);
		assert.equal(result.t.long, 'short');
	});
	test('spaces, positionals', () => {
		let result = blarg('-t [ one -n -e --long=short two ]');
		assert(typeof result.t == 'object');
		assert.isTrue(result.t.n);
		assert.isTrue(result.t.e);
		assert.equal(result.t.long, 'short');
		assert(result.t.$.length === 2);
		assert.equal(result.t.$[0], 'one');
		assert.equal(result.t.$[1], 'two');
	});
	test('no spaces, no positionals', () => {
		let result = blarg('-t [-n -e --long=short]');
		assert(typeof result.t == 'object');
		assert.isTrue(result.t.n);
		assert.isTrue(result.t.e);
		assert.equal(result.t.long, 'short');
	});
	test('no spaces, positionals', () => {
		let result = blarg('-t [one -n -e --long=short two]');
		assert(typeof result.t == 'object');
		assert.isTrue(result.t.n);
		assert.isTrue(result.t.e);
		assert.equal(result.t.long, 'short');
		assert(result.t.$.length === 2);
		assert.equal(result.t.$[0], 'one');
		assert.equal(result.t.$[1], 'two');
	});
	test('no spaces, end in assignment/value', () => {
		let result = blarg('-t [-new pos --long=short]');
		assert(typeof result.t == 'object');
		assert.isTrue(result.t.n);
		assert.isTrue(result.t.e);
		assert.isTrue(result.t.w);
		assert(result.t.$.length === 1);
		assert.equal(result.t.$[0], 'pos');
		assert.equal(result.t.long, 'short');
	});
	test('mixed spaces front, end in assignment/value', () => {
		let result = blarg('-t [ -new pos --long=short]');
		assert(typeof result.t == 'object');
		assert.isTrue(result.t.n);
		assert.isTrue(result.t.e);
		assert.isTrue(result.t.w);
		assert(result.t.$.length === 1);
		assert.equal(result.t.$[0], 'pos');
		assert.equal(result.t.long, 'short');
	});
	test('mixed spaces tail, end in assignment/value', () => {
		let result = blarg('-t [-new pos --long=short ]');
		assert(typeof result.t == 'object');
		assert.isTrue(result.t.n);
		assert.isTrue(result.t.e);
		assert.isTrue(result.t.w);
		assert(result.t.$.length === 1);
		assert.equal(result.t.$[0], 'pos');
		assert.equal(result.t.long, 'short');
	});
	test('sub-subargs depth 2', () => {
		let result = blarg('-z [ -Z [ -z ] ]');
		assert(typeof result.z == 'object');
		assert(typeof result.z.Z == 'object');
		assert.isTrue(result.z.Z.z);
	});
	test('sub-subargs depth 3', () => {
		let result = blarg('-z [ sub1 -Z [ sub2 -z [ sub3 -Z ] ] ]');
		assert(typeof result.z == 'object');
		assert(typeof result.z.Z == 'object');
		assert(typeof result.z.Z.z == 'object');
		assert.isTrue(result.z.Z.z.Z);
		assert.equal(result.z.$[0], 'sub1');
		assert.equal(result.z.Z.$[0], 'sub2');
		assert.equal(result.z.Z.z.$[0], 'sub3');
	});
});

suite('error recovery', () => {
	test('short-argument with = assignment', () => {
		let result = blarg('-Z=two');
		assert.equal(result.Z, 'two');
	});
	test('dangling subargs', () => {
		let result = blarg('-Z [ -z pos');
		assert(typeof result.Z == 'object');
		assert.equal(result.Z.z, 'pos');
	});
	test('dangling double quotes', () => {
		let result = blarg('-Z "value');
		assert.equal(result.Z, 'value');
	});
	test('dangling single quotes', () => {
		let result = blarg('-Z \'value');
		assert.equal(result.Z, 'value');
	});
	test('dangling double quote for quoted positional', () => {
		let result = blarg('"value""');
		assert(result.$.length === 1);
		assert.equal(result.$[0], 'value');
	});
	test('dangling single quote for quoted positional', () => {
		let result = blarg('\'value\'\'');
		assert(result.$.length === 1);
		assert.equal(result.$[0], 'value');
	});
});