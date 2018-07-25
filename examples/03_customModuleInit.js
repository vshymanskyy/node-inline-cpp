const InlineCPP = require('../');

const mod = InlineCPP(`
  String alice(const CallbackInfo& info) {
    return String::New(info.Env(), "Alice");
  }

  String bob(const CallbackInfo& info) {
    return String::New(info.Env(), "Bob");
  }

  Object Init(Env env, Object exports) {
    exports.Set("alice", Function::New(env, alice));
    exports.Set("bob", Function::New(env, bob));

    return exports;
  }
`);

console.log(mod.alice(), 'and', mod.bob()); // Alice and Bob
