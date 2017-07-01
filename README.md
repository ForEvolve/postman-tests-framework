# Postman test framework
A little Postman test framework to help avoid "messy-er" code.

The framework only work in the native implementations of Postman and does not support the Chrome App.

## How to use
You must first add a "shadow test" that query the framework script and save it in a global variable.
Then you can load the framework in subsequent tests using that variable.

**This test must be executed before the other tests.**

---

**Test name:** Load test framework

**GET URL:** https://raw.githubusercontent.com/ForEvolve/postman-tests-framework/master/postman-test-framework.js

**Tests code (*only this line id required:* `postman.setGlobalVariable("ForEvolve", responseBody);`):**

```JavaScript
try {
    // Eval the script
    var ForEvolve = eval(responseBody);
    
    // Test utilities
    var guid = ForEvolve.Tests.Utils.createGuid();
    tests["ForEvolve.Tests.Utils.createGuid() works."] = guid;
    
    // Create a test engine instance
    var x = new ForEvolve.Tests.Engine(this);
    tests["ForEvolve.Tests.Engine(this) is initialized."] = x;

    // Since we reached this point, all should be working: save the script in a global variable for future use.
    postman.setGlobalVariable("ForEvolve", responseBody);
    tests["Script loaded successfully"] = true;
} catch (ex) {
    tests["ForEvolve.Tests.Utils.createGuid() works."] = false;
    tests["ForEvolve.Tests.Engine(this) is initialized."] = false;
    tests["Script loaded successfully"] = false;
    
    // Stop the runner, it is useless to continue since the test framework failed to load.
    postman.setNextRequest(null);
}
```

*This line of code: `postman.setNextRequest(null);` cancel subsequent tests if the script fails to load; useful if you are using Runner.*

---

Then in other subsequent tests, you can use the framework, example, in the `tests` tab of your Postman test:

```JavaScript
var ForEvolve = eval(postman.getGlobalVariable("ForEvolve")); // This reload the saved script
var myTarget = new ForEvolve.Tests.Engine(this);
myTarget.response.should.be.fast();
myTarget.response.should.not.be.empty();
myTarget.response.should.be.json();
myTarget.response.should.be.ok();
```

You can optionally pass a second argument to the constructor containing options, exemple:
```JavaScript
var ForEvolve = eval(postman.getGlobalVariable("ForEvolve"));
var myTarget = new ForEvolve.Tests.Engine(this, {
    expectedFastResponseTime: 100
});
```

## Environment variables
If you prefer to define options globally, you can use environment variables.

* The `ExpectedFastResponseTime` environment variable allow you to configure the `myTarget.response.should.be.fast()` option. The value is in milliseconds.

## Options
You can define options per test basis or globally.

| Option                   | Environment variable     | Default value | Description                                                                                                     |
|--------------------------|--------------------------|:-------------:|-----------------------------------------------------------------------------------------------------------------|
| expectedFastResponseTime | ExpectedFastResponseTime |      200      | This option allow you to configure the `myTarget.response.should.be.fast()` test. The value is in milliseconds. |

## What's next?
This is a work in progress with some "only I can use it" parts that I will extract, remove or refactor in the future. This is still usable by anyone that want to. To be really usefull, I will obviously need to write some more documentation.

I will do my best to keep this project up to date and to clean it up a little more before adding new features.
This should not be to hard since I am using it myself.
