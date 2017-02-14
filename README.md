# Postman test framework
A little Postman test framework to help avoid "messy-er" code.

This is a work in progress, and it's only working in Postman for Chrome due to the use of the `window` variable. 

*I have been half-successful in Postman for Windows, but I could not have one framework for both software at the same time. I decided to revert to Chrome only, for now.*

## How to use
You must first add a "shadow test" that query the framework script.

**This test must be executed before the other tests.**

---

**Test name:** Load test framework

**GET URL:** https://raw.githubusercontent.com/ForEvolve/postman-tests-framework/master/postman-test-framework.js

**Tests code (*only the 1st line is required*):**

```JavaScript
eval(responseBody);
if (ForEvolve && ForEvolve.Tests) {
    tests["Script loaded successfully"] = true;
} else {
    tests["Script loaded successfully"] = false;
    postman.setNextRequest(null);
}
```

*This line of code: `postman.setNextRequest(null);` cancel subsequent tests if the script fails to load; useful if you are using Runner.*

---

Then in other subsequent tests, you can use the framework, example, in the `tests` tab of your Postman test:

```JavaScript
var myTarget = new ForEvolve.Tests.Engine(this, tests);
myTarget.response.should.be.fast();
myTarget.response.should.not.be.empty();
myTarget.response.should.be.json();
myTarget.response.should.be.ok();
```

*For some reasons, the `tests` array is not accessible from the `this` object (nor from `window` if I remember well) so we have to pass it when constructing our object, like this: `new ForEvolve.Tests.Engine(this, tests);`. It does, however, work in Postman for Windows, using `this.tests`.*

## Environment variables
You can set different targets for different environments.

* `myTarget.response.should.be.fast()` require the environment variable `ExpectedFastResponseTime`. It is in milliseconds.

## What's next?
There is some "only I can use it" parts that I will extract and some parts that I will refactor when the need arises.
