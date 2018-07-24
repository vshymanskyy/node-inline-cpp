const compile = require('../');

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

