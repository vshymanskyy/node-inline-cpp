const fs = require('fs');
const crypto = require('crypto');
const { execSync } = require('child_process');
const paths = require('env-paths')('nodejs-inline-cpp', {suffix: ''});
const findParentDir = require('find-parent-dir');
const debug = require('debug')('inline-cpp');

function generate_module(code) {
  let body =
`
#include <napi.h>
using namespace Napi;

${code}

Object Init(Env env, Object exports) {
  exports.Set("func", Function::New(env, func));
  
  return exports;
}

NODE_API_MODULE(addon, Init)
`;

  const modName = 'm_' + crypto.createHash('sha1').update(body).digest("hex");
  const modPath = `${paths.cache}/${modName}`;
  const modNode = `${modPath}/build/Release/${modName}.node`;

  if (fs.existsSync(modNode)) {
    debug('Loading cached', modPath);
    try {
      return require(modNode).func;
    } catch(e) {}
  }

  let nodeAddon = require.resolve('node-addon-api');

  let binding = {
    "targets": [
      {
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
        "defines": ["NAPI_CPP_EXCEPTIONS"]
      }
    ]
  };

  debug('Building', modPath);

  try {
    fs.mkdirSync(paths.cache);
  } catch(e) {}
  try {
    fs.mkdirSync(modPath);
  } catch(e) {}

  fs.writeFileSync(`${modPath}/module.cpp`, body);
  fs.writeFileSync(`${modPath}/binding.gyp`, JSON.stringify(binding, null, 2));

  let nodeGyp = require.resolve('node-gyp');
  nodeGyp = findParentDir.sync(nodeGyp, 'package.json');

  execSync(`node ${nodeGyp}/bin/node-gyp.js configure --directory=${modPath}`, {stdio: [null,null,null]})

  try {
    execSync(`node ${nodeGyp}/bin/node-gyp.js build --directory=${modPath}`, {stdio: [null,null,null]})
    return require(modNode).func;
  } catch (e) {
    throw new Error('C++ build failed')
  }
}

module.exports = function(obj) {
  let compileString;
  // Handle tagged template invocation
  if (Array.isArray(obj) && Array.isArray(obj.raw)) {
    let interpVals = [].concat(Array.prototype.slice.call(arguments)).slice(1);
    compileString = obj[0];
    for (let i = 0, l = interpVals.length; i < l; i++) {
      compileString += '' + interpVals[i] + obj[i + 1];
    }
  }

  return generate_module(compileString);
}
