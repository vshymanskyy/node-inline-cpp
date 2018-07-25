const InlineCPP = require('../');

// Create a compiler with some custom options to node-gyp
const compile = InlineCPP({ "defines": [`SOME_MESSAGE="Bazinga!"`] });

const func = compile(`
  String func(const CallbackInfo& info) {
    return String::New(info.Env(), SOME_MESSAGE);
  }
`)

console.log(func()); // Bazinga!
