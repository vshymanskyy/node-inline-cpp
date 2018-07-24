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

## Usage

```js
// test.js
const compile = require('inline-cpp');

const Hello = compile `
  String func(const CallbackInfo& info) {
    return String::New(info.Env(), "Hello");
  }
`

const World = compile `
  String func(const CallbackInfo& info) {
    return String::New(info.Env(), "World!");
  }
`

console.log(Hello(), World())
```
Now run it:
```sh
➜ node test.js
Hello World!
```

The first time you run the script, it takes longer time to execute.  
For each inline block of code, a native module will be generated, compiled with `node-gyp` and loaded dynamically.  
The next time you run the script, it will reuse previous build results (unless you change the inline C++ code). The build results are cached.  

For more C++ code examples, see [node-addon-api](https://github.com/nodejs/node-addon-api#examples)

## Disclaimer

This is only a prototype. I created this to check the geneal concept.  
You're welcome to contribute - here are some ideas:

- [ ] Use node-gyp directly, instead of invoking `node node-gyp.js`
- [ ] Improve error handling/reporting
- [ ] Parse/Find all finctions in the block of code, add them to exports
- [ ] Create advanced usage examples
- [ ] ...
