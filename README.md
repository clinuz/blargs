# blargs
_(think the expression "BLARG" munged with "args")_
### A very, very simple and convention-based argument parser


While it is not my general goal to re-create something that has been exhaustively developed and engineered, I often found myself needing features that were not consistently available from a single source. _blargs_ is an attempt to create a simple, reliable, performant and consistent argument parser that can be used as-is or wrapped by other utilities.

While this project is _vastly_ different in implementation, I would like to give a shout-out to some projects I have used over the years that influenced some of the features I have added:

- [minimist](https://github.com/substack/minimist) by @substack
- [subarg](https://github.com/substack/subarg) by @substack
- [nomnom](https://github.com/harthur/nomnom) (deprecated) by @harthur

### Check This

```bash
# can also be used in your project
npm install -g blargs
# test using the command-line test utility
blargs "is this" -a --test
# => [ { a: true, test: true }, [ 'is this' ], null ]
echo '"is this" -a --test' | blargs
# => [ { a: true, test: true }, [ 'is this' ], null ]
```

Wondering what that output means and how the hell it's useful? [Read about programmatic usage and see the examples](#programmatic-usage).

### Quick Contents

- [Unexplained Overview](#check-this)
- [Tool Features](#tool-features)
- [Language Features](#language-features)
	- [Booleans](#booleans)
	- [Assignment](#assignment)
	- [Positionals](#positionals)
	- [Subargs](#subargs)
	- [Next-Argument](#next-argument)
- [Programmatic Usage](#programmatic-usage)
- [Issues, Feature Request](#problems)

#### Tool Features

- Treats command-line arguments as a context-free grammar (an un-opinionated language)
- Handles _strings_ and _arrays_ of arguments
- Performs quite well
- Returns an ES6 destructuring iterable (compatible with ES5 by array index) which ensures all keys on named-arguments object are valid (see below)
- Comes with a useful command-line argument testing utility so you don't need to write your own just to see how it will break down your arguments


#### Language Features

- negateable booleans (-no-x,--no-xarg)
- multiple boolean short-hand args (-abcd, -no-abcd)
- (_recursive_) subarg notation support
- (_recursive_) next-argument handling
- multiples of same argument support

##### Booleans

```bash
# standard single argument declarations
-a          # a -> true
-a true     # a -> true
-a=true     # a -> true
-no-a       # a -> false
-a false    # a -> false
-a=false    # a -> false

# multiple short-hand argument booleans in single statement
-abcd       # a, b, c and d -> true
-no-abcd    # a, b, c and d -> false

# full argument flag
--arg       # arg -> true
--no-arg    # arg -> false
--arg=true  # arg -> true
--arg=false # arg -> false
``` 
##### Assignment

```bash
# standard single argument assignment methods
-a value    # NOTE that positional arguments after short-hand are assigned
-a=value
-a "value with spaces"
-a 'value with spaces'
-a="value with spaces"
-a='value with spaces'
--arg=value
--arg="value with spaces"
--arg='value with spaces'
```

##### Positionals

```bash
# positional arguments can be anywhere except after single short-hand boolean
arg1 arg2 -a # cannot place positional argument here
arg1 arg2 -abc arg3 # can place positional argument here
```

##### Subargs

```bash
# subargs must be assigned but may be nested (spaces inside bracket not required)
-a [ arg -abc --arg=value ]
-a=[ arg -abc --arg=value ]
--arg=[ arg -abc --arg=value ]
# nested example
-a [ arg -abc --arg=[ nested -abc ] ]
```

##### Next-Argument

Sometimes it is useful to specify multiple ordered commands. These _next-arguments_ can be nested inside _subargs_ and _next-arguments_ can be nested inside _subargs_.

```bash
# if -- is encountered the previous command is considered "complete"
--arg=value -- -abc --arg
# you can nest next-arguments in subargs
--arg=[ arg -- -abc --arg ] -- -abc --arg
# you can nest subargs in next-arguments
--arg=value -- -abc --arg=[ arg -abc ]
```

#### Programmatic Usage

This tool is actually designed to work with another project, [vlargs](https://github.com/clinuz/vlargs), a command line validator and sanitizer. However, there are plenty of reasons you may want to use _blargs_ by itself.

Let me take a second to describe how to use it _and then I will explain why it returns what it does_.

Including the project is a snap, `npm install --save blargs` (if you install from github you will need to `npm install && npm run prepublish` to generate the executable code since it uses Babel to transpile).

In your project you could then:

```javascript
import blargs from 'blargs';
// or in ES5
// var blargs = require('blargs');

// designed first for ES6 to cleanly separate the return values
// by their context and meaning
let [ args, positionals, next ] = blargs();

// in ES5 the equivalent would be
var ret = blargs();
var args = ret[0];
var positionals = ret[1];
var next = ret[2];
```

Note that `blargs()` accepts _nothing_, or an _array of arguments_, or a _string_ to be parsed as arguments. When you call it without arguments, it automatically uses those provided by Node.

```javascript
// same as passing it process.argv.slice(2)
blargs();
blargs(['-a','-b','--arg="spaces are dope"']);
blargs('-a -b --arg="spaces are dope"');
```

[Assigned values](#assignment) are included as named keys on the first return value (always an _object_ even if it has no keys). Because we keep [positional arguments](#positionals) and [next-arguments sub-expressions](#next-argumemnt) out of the initial return value you can safely assume that _any_ keys are valid.

```javascript
// assuming args of -abc
args.a === true;
args.b === true;
args.c === true;

Object.keys(args) // safely use all keys, no reserved words to avoid

// we can also use non-alpha short-hand characters although some are
// ill-advised especially since some characters can't actually be used
// on the command-line (at least not bash)...
[ args ] = blargs('-abc -0 -$#@');
args['0'] === true;
args.a === true;
args.b === true;
args.c === true;
args['$'] === true;
args['#'] === true;
args['@'] === true;
```

[Positional arguments](#positionals), if they exist, will be an _array_ of those values in the order in which they were encountered. The only thing of note about positional arguments is that __they cannot be placed directly after a single, short-hand boolean flag or they will be interpreted as the assigned value__. This is a _rule_ of the argument language convention we are employing. To avoid, simply place positional arguments _before_ the single, short-hand boolean flag or combine short-hand boolean flags. If there are no positional arguments, it will be `null`.

```javascript
// arg3 is safe because -ab is 2 short-hand flags combined
[ args, positionals ] = blargs('arg1 arg2 -ab arg3');
// positionals -> ['arg1', 'arg2', 'arg3']
args.a === true;
args.b === true;

[ , positionals ] = blargs('"space filled positional"');
positionals[0] === 'space filled positional';

[ , positionals ] = blargs();
positionals === null;
```

[Next-argument sub-expressions](#next-argument) are essentially _another_ set of arguments to be interpreted separately. This would normally be used if you were intending to pass-through arguments to, say, another process or a sub-system. Even next-arguments are recursive meaning you can have lots of them. Interestingly, they return the exact same structure of a normal call to `blargs()`. If there aren't any then the third return value will be `null`.

```javascript
[ ,, next ] = blargs();
next === null;

[ args, positionals, next ] = blargs('-ab arg -- -no-ab blarg');
args.a === true;
args.b === true;
positionals[0] === 'arg';

// now the cool part, remember next can be deconstructed like the original
// if it exists (and we know it does)
[ args, positionals ] = next; // BOOM
args.a === false;
args.b === false;
positionals[0] === 'blarg';
```

And next-argument in next-argument?

```javascript
[ args, positionals, next ] = blargs('arg -a -- blarg -b -- -c');
args.a === true;
positionals[0] === 'arg';

[ args, positionals, next ] = next;
args.b === true;
positionals[0] === 'blarg';

[ args, positionals, next ] = next;
args.c === true;
positionals === null;
next === null;
```

[Subarg expressions](#subargs) are actual nested expressions that are assigned to a named value. Like [next-argument sub-expressions](#next-argument) they return the same, destructurable 3-part return value as that of a direct call to `blargs()`. Subargs are determined by a beginning `[` and ending `]` pair [assigned](#assignment) to a short-hand or full argument by any valid format. You can include any valid argument syntax including additional subargs or even next-argument sub-expressions.

```javascript
[ args ] = blargs('-a [ arg -a ]');
[ args, positionals ] = args.a;
args.a === true;
positionals[0] === 'arg';
```

### Problems

Please report issues and feature requests. Pull Requests welcome.

<br/>
<br/>
<br/>
<br/>


The MIT License (MIT)

Copyright (c) 2015 Cole Davis

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.