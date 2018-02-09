const cc = require('..');

const controller = cc();

function CallCode(param) {
	console.info("CallCode",param);
	return controller(function() {
	  console.info("Code",param,"starting");
	  return CodeThatTakes3SecondsToResolve()
		.then(function() {
		  console.info("Code",param,"executed");
		});
	},function(resolve,reject) {
	  console.info("Got unqueue handlers for",param);
	  setTimeout(function() {
		console.info("Aborting",param);
		reject();
	  },5000);
	})
}

function CodeThatTakes3SecondsToResolve() {
	return new Promise(function(resolve, reject) {
		setTimeout(resolve,3000);
	});
}

console.info("=== Test2 ==================");

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
