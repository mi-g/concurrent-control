const cc = require('..');

const controller = cc();

function CallCode(param) {
	console.info("CallCode",param);
	controller(()=>{
	  console.info("Code",param,"starting");
	  return CodeThatTakes3SecondsToResolve()
		.then(()=>{
		  console.info("Code",param,"done");
		});
	},(abort)=>{
	  console.info("Got abort handler for",param);
	  setTimeout(()=>{
		console.info("Aborting",param);
		abort();
	  },5000);
	})
}

function CodeThatTakes3SecondsToResolve() {
	return new Promise((resolve, reject) => {
		setTimeout(resolve,3000);
	});
}

console.info("=== Test2 ==================");

CallCode(1);
CallCode(2);
CallCode(3);

