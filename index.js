const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const paths = require('env-paths')('nodejs-inline-cpp', {suffix: ''});
const findParentDir = require('find-parent-dir');
const debug = require('debug')('inline-cpp');
const _ = require('lodash');

let nodeAddon, nodeGyp;

function findBuildDeps() {
  if (nodeAddon && nodeGyp) return;

  nodeAddon = require.resolve('node-addon-api');
  nodeAddon = findParentDir.sync(nodeAddon, 'package.json');

  nodeGyp = require.resolve('node-gyp');
  nodeGyp = findParentDir.sync(nodeGyp, 'package.json');
  nodeGyp = path.join(nodeGyp, 'bin', 'node-gyp.js');

  debug('Using node-gyp:', nodeGyp);
  debug('Using node-addon-api:', nodeAddon);
  
  // For some reason, windows needs path to be escaped
  if (os.platform() === 'win32') {
    nodeAddon = nodeAddon.replace(/[\\$'"]/g, "\\$&")
  }
}

function optsMerge(objValue, srcValue) {
  if (_.isArray(objValue)) {
    return objValue.concat(srcValue);
  }
}

function generateModule(code, opts) {

  opts = opts || {};

  code = code.trim();

  // The stripped code is only used for some auto-detection, it is not actually compiled!
  const strippedCode = ' ' + code
    .replace(/,/g, ' , ')
    .replace(/\(/g, ' ( ')
    .replace(/\)/g, ' ) ')
    .replace(/{/g, ' { ')
    .replace(/}/g, ' } ')
    .replace(/\s\s+/g, ' ') + ' ';
  
  // Find all function declarations
  let funcsRe = /(([a-zA-Z_][\w:]*)\s+([a-zA-Z_]\w*)\s*\(\s*((?:[a-zA-Z0-9_:&\*,\s])*)\s*\))\s*{/gm;
  let m;
  let funcs = [];
  let funcSingle, funcInit;
  
  while ((m = funcsRe.exec(strippedCode)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === funcsRe.lastIndex) {
      funcsRe.lastIndex++;
    }
    const func = {
      signature: m[1],
      name: m[3],
      returns: m[2],
      arguments: m[4]
    }
    debug('Function:', func.signature);

    if (func.name === 'Init') {
      funcInit = func;
    } else {
      funcs.push(func);
    }
  }

  if (funcs.length === 1) funcSingle = funcs[0];

  let init = '';

  // If init function is not provided, generate it
  if (!funcInit) {
    init = 'Object Init(Env env, Object exports) {\n';

    for (let f of funcs) {
      init += `  exports.Set("${f.name}", Function::New(env, ${f.name}));\n`;
    }

    init += '  return exports;\n'
    init += '}\n';
  }

  let body =
`
#include <napi.h>
using namespace Napi;

${code}
${init}

NODE_API_MODULE(addon, Init)
`;

  // Generate a hash using actual code and build options
  const modName = 'm_' + crypto.createHash('sha1').update(JSON.stringify(opts)).update(body).digest("hex");

  const modPath = path.join(paths.cache, modName);
  const modNode = path.join(modPath, 'build', 'Release', modName+'.node');

  // If the same hash exists, try loading it
  if (fs.existsSync(modNode)) {
    debug('Loading cached', modPath);
    try {
      if (funcSingle && !funcInit) {
        return require(modNode)[funcSingle.name];
      } else {
        return require(modNode);
      }
    } catch(e) {}
  }

  // Ok no luck, let's build it...

  findBuildDeps();

  let gypTarget = {
    "target_name": modName,
    "sources": [
      "module.cpp"
    ],
    "include_dirs": [
      `<!@(node -p "require('${nodeAddon}').include")`
    ],
    "dependencies": [
      `<!(node -p "require('${nodeAddon}').gyp")`
    ],
    "cflags!": ["-fno-exceptions"],
    "cflags_cc!": ["-fno-exceptions"],
    "xcode_settings": {
      "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
      "CLANG_CXX_LIBRARY": "libc++",
      "MACOSX_DEPLOYMENT_TARGET": "10.7",
    },
    "msvs_settings": {
      "VCCLCompilerTool": { "ExceptionHandling": 1 },
    },
    "defines": ["NAPI_CPP_EXCEPTIONS"],
  }
  
  gypTarget = _.mergeWith(gypTarget, opts, optsMerge)

  let binding = {
    "targets": [ gypTarget ]
  };

  debug('Building', modPath);

  try {
    fs.mkdirSync(path.join(paths.cache, '..'));
  } catch(e) {}
  try {
    fs.mkdirSync(paths.cache);
  } catch(e) {}
  try {
    fs.mkdirSync(modPath);
  } catch(e) {}

  fs.writeFileSync(path.join(modPath, 'module.cpp'), body);
  fs.writeFileSync(path.join(modPath, 'binding.gyp'), JSON.stringify(binding, null, 2));

  let execOpts = {
    stdio: (debug.enabled) ? [0,1,2] : [null,null,null]
  };

  execSync(`node "${nodeGyp}" configure --directory="${modPath}"`, execOpts)

  try {
    execSync(`node "${nodeGyp}" build --directory="${modPath}"`, execOpts)
    if (funcSingle && !funcInit) {
      return require(modNode)[funcSingle.name];
    } else {
      return require(modNode);
    }
  } catch (e) {
    throw new Error('C++ build failed')
  }
}

function compiler(opts) {

  return function(obj) {
    let compileString;
    // Handle tagged template invocation
    if (Array.isArray(obj) && Array.isArray(obj.raw)) {
      let interpVals = [].concat(Array.prototype.slice.call(arguments)).slice(1);
      compileString = obj[0];
      for (let i = 0, l = interpVals.length; i < l; i++) {
        compileString += '' + interpVals[i] + obj[i + 1];
      }
    } else if (typeof obj === 'string' || obj instanceof String) {
      compileString = obj;
    }
    
    if (compileString) {
      return generateModule(compileString, opts);
    }
    
    throw new Error('Wrong arguments for inline-cpp')
  }
}

module.exports = function(obj) {
  if (typeof obj === 'object' &&
      !Array.isArray(obj)
  ) {
    return compiler(obj)
  }

  return compiler()(obj)
}
