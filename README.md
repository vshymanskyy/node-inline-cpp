[![NPM version](https://img.shields.io/npm/v/inline-cpp.svg)](https://www.npmjs.com/package/inline-cpp)
[![NPM download](https://img.shields.io/npm/dm/inline-cpp.svg)](https://www.npmjs.com/package/inline-cpp)
[![GitHub issues](https://img.shields.io/github/issues/vshymanskyy/node-inline-cpp.svg)](https://github.com/vshymanskyy/node-inline-cpp/issues)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/vshymanskyy/node-inline-cpp)

[![NPM](https://nodei.co/npm/inline-cpp.svg)](https://nodei.co/npm/inline-cpp/)

# inline-cpp
Inline C++ with Node.js

**Works on:** 
<img src="https://cdn.rawgit.com/simple-icons/simple-icons/develop/icons/linux.svg" width="18" height="18" /> Linux,
<img src="https://cdn.rawgit.com/simple-icons/simple-icons/develop/icons/windows.svg" width="18" height="18" /> Windows,
<img src="https://cdn.rawgit.com/simple-icons/simple-icons/develop/icons/apple.svg" width="18" height="18" /> MacOS

**Purpose:**
- Simplify native module prototyping. Enable native code in Node.js REPL.
- Allow JS scripts to generate C++ code and run it dynamically.
- Popularise NAPI usage and `node-addon-api`.
- This is **NOT** intended to be used as native module replacement!  
If you want to publish a native module, please package it as required by `node-gyp`.

## Installation

```sh
npm install --save inline-cpp
```
or install it globally (it works with Node.js REPL):
```sh
npm install -g inline-cpp
```

## Usage

```js
// test.js
const compile = require('inline-cpp');

const hello = compile `
  String func(const CallbackInfo& info) {
    return String::New(info.Env(), "Hello world from C++!");
  }
`

console.log(hello())
```
Now run it:
```sh
➜ node test.js
Hello world from C++!
```

The first time you run the script, it takes longer to execute. For each inline block of code, a native module will be generated, compiled with `node-gyp` and loaded dynamically. If the module `Init` function is not defined, it is generated as well.  
The next time you run the script, it will reuse previously generated module, so it will run instantly (unless you change the inline C++ code).  

For more C++ code examples, see [node-addon-api](https://github.com/nodejs/node-addon-api#examples)  
For more `inline-cpp` API examples, see [examples on github](https://github.com/vshymanskyy/node-inline-cpp/tree/master/examples)

## API

`inline-cpp` supports several invocation methods.

Pass some code as string to build it with default options.
```js
const InlineCPP = require('inline-cpp');
InlineCPP('code')
```

You can also pass code using [tagged template syntax](https://developers.google.com/web/updates/2015/01/ES6-Template-Strings#tagged_templates).
```js
InlineCPP `code`
```

Pass an object to create a new compiler with custom options.  
Options will get passed to `node-gyp` target.  
```js
const customCompiler = InlineCPP({ ... })
```

If the code block only contains a single function, the compiler returns the function.  
If it contains multiple functions or custom `Init`, the module itself is returned.

## Disclaimer

This is just a prototype. I created this to check the general concept.  
You're welcome to contribute! Here are some ideas:

- [x] Parse/Find all functions in the block of code, add them to exports
- [ ] Use node-gyp directly, instead of invoking `node node-gyp.js`
- [ ] Improve error handling/reporting
- [ ] Create advanced usage examples
- [ ] Cleanup unused modules from cache periodically
- [ ] ...

## Debugging

You can enable debug output by setting env. variable: `DEBUG=inline-cpp`
