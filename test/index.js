'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

var _chai = require('chai');

var _ = require('../');

var _2 = _interopRequireDefault(_);

suite('long-arguments', function () {
	test('boolean flags', function () {
		var result = (0, _2['default'])('--one --two --three');
		_chai.assert.isTrue(result.one);
		_chai.assert.isTrue(result.two);
		_chai.assert.isTrue(result.three);
	});
	test('negative boolean flags', function () {
		var result = (0, _2['default'])('--no-one --no-two --no-three');
		_chai.assert.isFalse(result.one);
		_chai.assert.isFalse(result.two);
		_chai.assert.isFalse(result.three);
	});
	test('assignment', function () {
		var result = (0, _2['default'])('--one=two --two="three four" --three=val,val,val');
		_chai.assert.equal(result.one, 'two');
		_chai.assert.equal(result.two, 'three four');
		_chai.assert.equal(result.three, 'val,val,val');
	});
	test('complex values', function () {
		var result = (0, _2['default'])('--one=~`!@#$%^&*()-_+=:;{}[]123|\\/?456<>abcdef,.');
		_chai.assert.equal(result.one, '~`!@#$%^&*()-_+=:;{}[]123|\\/?456<>abcdef,.');
	});
});

suite('short-arguments', function () {
	test('boolean flags', function () {
		var result = (0, _2['default'])('-o -n -e');
		_chai.assert.isTrue(result.o);
		_chai.assert.isTrue(result.n);
		_chai.assert.isTrue(result.e);
	});
	test('multiple boolean flags', function () {
		var result = (0, _2['default'])('-one');
		_chai.assert.isTrue(result.o);
		_chai.assert.isTrue(result.n);
		_chai.assert.isTrue(result.e);
	});
	test('negative boolean flags', function () {
		var result = (0, _2['default'])('-no-o -no-n -no-e');
		_chai.assert.isFalse(result.o);
		_chai.assert.isFalse(result.n);
		_chai.assert.isFalse(result.e);
	});
	test('multiple negative boolean flags', function () {
		var result = (0, _2['default'])('-no-one');
		_chai.assert.isFalse(result.o);
		_chai.assert.isFalse(result.n);
		_chai.assert.isFalse(result.e);
	});
	test('assignment', function () {
		var result = (0, _2['default'])('-o two -n "three four" -e val,val,val');
		_chai.assert.equal(result.o, 'two');
		_chai.assert.equal(result.n, 'three four');
		_chai.assert.equal(result.e, 'val,val,val');
	});
	test('complex values', function () {
		var result = (0, _2['default'])('-o ~`!@#$%^&*()-_+=:;{}[]123|\\/?456<>abcdef,.');
		_chai.assert.equal(result.o, '~`!@#$%^&*()-_+=:;{}[]123|\\/?456<>abcdef,.');
	});
});

suite('positional arguments', function () {
	test('single positional argument', function () {
		var result = (0, _2['default'])('argument');
		(0, _chai.assert)(result.$.length === 1);
		_chai.assert.equal(result.$[0], 'argument');
	});
	test('multiple positional arguments', function () {
		var result = (0, _2['default'])('argument1 argument2 argument3');
		(0, _chai.assert)(result.$.length === 3);
		_chai.assert.equal(result.$[0], 'argument1');
		_chai.assert.equal(result.$[1], 'argument2');
		_chai.assert.equal(result.$[2], 'argument3');
	});
});

suite('subargs', function () {
	test('spaces, no positionals', function () {
		var result = (0, _2['default'])('-t [ -n -e --long=short ]');
		(0, _chai.assert)(typeof result.t == 'object');
		_chai.assert.isTrue(result.t.n);
		_chai.assert.isTrue(result.t.e);
		_chai.assert.equal(result.t.long, 'short');
	});
	test('spaces, positionals', function () {
		var result = (0, _2['default'])('-t [ one -n -e --long=short two ]');
		(0, _chai.assert)(typeof result.t == 'object');
		_chai.assert.isTrue(result.t.n);
		_chai.assert.isTrue(result.t.e);
		_chai.assert.equal(result.t.long, 'short');
		(0, _chai.assert)(result.t.$.length === 2);
		_chai.assert.equal(result.t.$[0], 'one');
		_chai.assert.equal(result.t.$[1], 'two');
	});
	test('no spaces, no positionals', function () {
		var result = (0, _2['default'])('-t [-n -e --long=short]');
		(0, _chai.assert)(typeof result.t == 'object');
		_chai.assert.isTrue(result.t.n);
		_chai.assert.isTrue(result.t.e);
		_chai.assert.equal(result.t.long, 'short');
	});
	test('no spaces, positionals', function () {
		var result = (0, _2['default'])('-t [one -n -e --long=short two]');
		(0, _chai.assert)(typeof result.t == 'object');
		_chai.assert.isTrue(result.t.n);
		_chai.assert.isTrue(result.t.e);
		_chai.assert.equal(result.t.long, 'short');
		(0, _chai.assert)(result.t.$.length === 2);
		_chai.assert.equal(result.t.$[0], 'one');
		_chai.assert.equal(result.t.$[1], 'two');
	});
	test('no spaces, end in assignment/value', function () {
		var result = (0, _2['default'])('-t [-new pos --long=short]');
		(0, _chai.assert)(typeof result.t == 'object');
		_chai.assert.isTrue(result.t.n);
		_chai.assert.isTrue(result.t.e);
		_chai.assert.isTrue(result.t.w);
		(0, _chai.assert)(result.t.$.length === 1);
		_chai.assert.equal(result.t.$[0], 'pos');
		_chai.assert.equal(result.t.long, 'short');
	});
	test('mixed spaces front, end in assignment/value', function () {
		var result = (0, _2['default'])('-t [ -new pos --long=short]');
		(0, _chai.assert)(typeof result.t == 'object');
		_chai.assert.isTrue(result.t.n);
		_chai.assert.isTrue(result.t.e);
		_chai.assert.isTrue(result.t.w);
		(0, _chai.assert)(result.t.$.length === 1);
		_chai.assert.equal(result.t.$[0], 'pos');
		_chai.assert.equal(result.t.long, 'short');
	});
	test('mixed spaces tail, end in assignment/value', function () {
		var result = (0, _2['default'])('-t [-new pos --long=short ]');
		(0, _chai.assert)(typeof result.t == 'object');
		_chai.assert.isTrue(result.t.n);
		_chai.assert.isTrue(result.t.e);
		_chai.assert.isTrue(result.t.w);
		(0, _chai.assert)(result.t.$.length === 1);
		_chai.assert.equal(result.t.$[0], 'pos');
		_chai.assert.equal(result.t.long, 'short');
	});
	test('sub-subargs depth 2', function () {
		var result = (0, _2['default'])('-z [ -Z [ -z ] ]');
		(0, _chai.assert)(typeof result.z == 'object');
		(0, _chai.assert)(typeof result.z.Z == 'object');
		_chai.assert.isTrue(result.z.Z.z);
	});
	test('sub-subargs depth 3', function () {
		var result = (0, _2['default'])('-z [ sub1 -Z [ sub2 -z [ sub3 -Z ] ] ]');
		(0, _chai.assert)(typeof result.z == 'object');
		(0, _chai.assert)(typeof result.z.Z == 'object');
		(0, _chai.assert)(typeof result.z.Z.z == 'object');
		_chai.assert.isTrue(result.z.Z.z.Z);
		_chai.assert.equal(result.z.$[0], 'sub1');
		_chai.assert.equal(result.z.Z.$[0], 'sub2');
		_chai.assert.equal(result.z.Z.z.$[0], 'sub3');
	});
});

suite('error recovery', function () {
	test('short-argument with = assignment', function () {
		var result = (0, _2['default'])('-Z=two');
		_chai.assert.equal(result.Z, 'two');
	});
	test('dangling subargs', function () {
		var result = (0, _2['default'])('-Z [ -z pos');
		(0, _chai.assert)(typeof result.Z == 'object');
		_chai.assert.equal(result.Z.z, 'pos');
	});
	test('dangling double quotes', function () {
		var result = (0, _2['default'])('-Z "value');
		_chai.assert.equal(result.Z, 'value');
	});
	test('dangling single quotes', function () {
		var result = (0, _2['default'])('-Z \'value');
		_chai.assert.equal(result.Z, 'value');
	});
	test('dangling double quote for quoted positional', function () {
		var result = (0, _2['default'])('"value""');
		(0, _chai.assert)(result.$.length === 1);
		_chai.assert.equal(result.$[0], 'value');
	});
	test('dangling single quote for quoted positional', function () {
		var result = (0, _2['default'])('\'value\'\'');
		(0, _chai.assert)(result.$.length === 1);
		_chai.assert.equal(result.$[0], 'value');
	});
});