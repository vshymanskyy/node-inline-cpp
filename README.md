[![NPM version](https://img.shields.io/npm/v/inline-cpp.svg)](https://www.npmjs.com/package/inline-cpp)
[![NPM download](https://img.shields.io/npm/dm/inline-cpp.svg)](https://www.npmjs.com/package/inline-cpp)
[![GitHub issues](https://img.shields.io/github/issues/vshymanskyy/node-inline-cpp.svg)](https://github.com/vshymanskyy/node-inline-cpp/issues)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/vshymanskyy/node-inline-cpp)

[![NPM](https://nodei.co/npm/inline-cpp.png)](https://nodei.co/npm/inline-cpp/)

# inline-cpp
Inline C++ with Node.js

## Installation

```sh
npm install --save inline-cpp
```
or
```sh
npm install -g inline-cpp
```

Was tested on Linux and Windows. MacOS should also work.

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

The first time you run the script, it takes longer time to execute.  
For each inline block of code, a native module will be generated, compiled with `node-gyp` and loaded dynamically.  
The next time you run the script, it will reuse previous build results (unless you change the inline C++ code). The build results are cached.  

For more C++ code examples, see [node-addon-api](https://github.com/nodejs/node-addon-api#examples)

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

## Disclaimer

This is just a prototype. I created this to check the general concept.  
You're welcome to contribute! Here are some ideas:

- [ ] Use node-gyp directly, instead of invoking `node node-gyp.js`
- [ ] Improve error handling/reporting
- [ ] Parse/Find all functions in the block of code, add them to exports
- [ ] Create advanced usage examples
- [ ] Cleanup unused modules from cache periodically
- [ ] ...

## Debugging

You can enable debug output by setting env. variable: `DEBUG=inline-cpp`
