const InlineCPP = require('../');

// Tagged template with default options
const hello = InlineCPP `
  String func(const CallbackInfo& info) {
    return String::New(info.Env(), "Hello");
  }
`

// Create a compiler with some custom options to node-gyp
const customCPP = InlineCPP({ "defines": [`SOME_MESSAGE="World!"`] });

const world = customCPP(`
  String func(const CallbackInfo& info) {
    return String::New(info.Env(), SOME_MESSAGE);
  }
`)

console.log(hello(), world())
