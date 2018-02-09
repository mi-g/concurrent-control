
# Description

Controls the number of simultaneous calls to a promise-returning function.

```javascript
const cc = require('concurrent-control');

const controller = cc();

function Test(value) {
  console.info("Test",value,"enters");
  return new Promise((resolve,reject)=>{
    setTimeout(()=>{
      console.info("Test",value,"returns");
      resolve();
    },5000);
  });
}

function TestCaller(value) {
  controller(()=>{
    return Test(value);
  });
}

TestCaller(1);
TestCaller(2);
```

this produces:

```
Test 1 enters
Test 1 returns
Test 2 enters
Test 2 returns
```


# Install

```
npm install concurrent-control --save
```

# Documentation

The module exports a function to be called to create a controller.

```javascript
// const concurrentControl = require('concurrent-control');
// var controller =

moduleFunction([options])
```

`options`: an integer representing the number of allowed simultaneous calls, or a function returning this number, or a function returning a _Promise_ that resolves to this number. If `options` is omitted, the default value is `1`, meaning the controlled code can be called once at a time.

Returns a function to be called every time the controlled code is to be invoked:

```javascript
controller(fn[,unqueueFn])
```

`fn`: the function to be called in a controlled way

`unqueueFn`: callback function called right after the call has been queued and offers functions as parameters to remove the call from the queue, resulting in resolving or reject the controller _Promise_. Note that if the call has started or is being executed, it cannot be aborted this way.

Returns a _Promise_ that will either resolve or reject as the result of the code being executed or un-queued.

Example:

```javascript
function CallCode(param) {
  console.info("CallCode",param);
  controller(()=>{
    console.info("Code",param,"starting");
    return codeThatTakes3SecondsToResolve()
      .then(()=>{
        console.info("Code",param,"done");
      });
  },(resolve,reject)=>{
    console.info("Got unqueue handlers for",param);
    setTimeout(()=>{
      console.info("Aborting",param);
      reject(); // resolve() would also un-queue the call
    },5000);
  });
}
for(var i=1; i<=3; i++)
  (function(index) {
    CallCode(index)
      .then(function() {
        console.info("Call",index,"resolved");
      })
      .catch(function(err) {
        console.info("Call",index,"rejected");
      })
    })(i);
```

produces:
```
CallCode 1
CallCode 2
CallCode 3
Code 1 starting
Got abort handler for 2
Got abort handler for 3
Code 1 executed
Code 2 starting
Call 1 resolved
Aborting 2
Aborting 3
Call 3 rejected
Code 2 executed
Call 2 resolved
```

`unqueueFn` for call `1` is never invoked since the action starts immediately.
When the un-queue reject function for call `2` is triggered, this call has already started so this has no effect.
Call `3` never starts since it was un-queued before it started executing.
