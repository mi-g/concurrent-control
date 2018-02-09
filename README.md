
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
controller(fn[,abortFn])
```

`fn`: the function to be called in a controlled way

`abortFn`: callback function called right after the call has been queued and offers a function as parameter to remove the call from the queue. Note that if the call has started or is being executed, it cannot be aborted this way.

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
  },(abort)=>{
    console.info("Got abort handler for",param);
    setTimeout(()=>{
      console.info("Aborting",param);
      abort();
    },5000);
  });
}
CallCode(1);
CallCode(2);
CallCode(3);
```

produces:
```
CallCode 1
CallCode 2
CallCode 3
Code 1 starting
Got abort handler for 2
Got abort handler for 3
Code 1 done
Code 2 starting
Aborting 2
Aborting 3
Code 2 done
```

`abortFn` for call `1` is never invoked since the action starts immediately.
When the abort function for call `2` is triggered, this call has already started so this has no effect.
Call `3` never starts since it was unqueued before it started executing.
