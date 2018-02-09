const cc = require('..');

const controller = cc();

function Test(value) {
  console.info("Test",value,"enters");
  return new Promise((resolve,reject)=>{
    setTimeout(()=>{
      console.info("Test",value,"returns");
      resolve();
    },2000);
  });
}

function TestCaller(value) {
  controller(()=>{
    return Test(value);
  });
}

console.info("=== Test1 ==================");

TestCaller(1);
TestCaller(2);
