const fs = require('fs');
const crypto = require('crypto');
const { execSync } = require('child_process');
const paths = require('env-paths')('nodejs-inline-cpp', {suffix: ''});

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
    try {
      return require(modNode).func;
    } catch(e) {}
  }

  let binding = {
    "targets": [
      {
        "target_name": modName,
        "sources": [
          "module.cpp"
        ],
        "include_dirs": [
          `<!@(node -p "require('${__dirname}/node_modules/node-addon-api').include")`
        ],
        "dependencies": [
          `<!(node -p "require('${__dirname}/node_modules/node-addon-api').gyp")`
        ],
        "cflags!": ["-fno-exceptions"],
        "cflags_cc!": ["-fno-exceptions"],
        "defines": ["NAPI_CPP_EXCEPTIONS"]
      }
    ]
  };
  
  console.log('Building', modPath);

  try {
    fs.mkdirSync(paths.cache);
  } catch(e) {}
  try {
    fs.mkdirSync(modPath);
  } catch(e) {}

  fs.writeFileSync(`${modPath}/module.cpp`, body);
  fs.writeFileSync(`${modPath}/binding.gyp`, JSON.stringify(binding, null, 2));

  execSync(`${__dirname}/node_modules/.bin/node-gyp configure --directory=${modPath}`, {stdio: [null,null,null]})

  try {
    execSync(`${__dirname}/node_modules/.bin/node-gyp build --directory=${modPath}`, {stdio: [null,null,null]})
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
