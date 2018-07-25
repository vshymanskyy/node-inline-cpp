const InlineCPP = require('../');

// Tagged template with default options
const hello = InlineCPP `
  String func(const CallbackInfo& info) {
    return String::New(info.Env(), "Hello world!");
  }
`

console.log(hello())
