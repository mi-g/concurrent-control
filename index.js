/*
 * concurrent-control
 *
 * @summary Controls the number of simultaneous calls to a promise-returning function
 * @author Michel Gutierrez
 * @link https://github.com/mi-g/weh
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

function Concurrent(maxFn) {
	if(typeof maxFn === "undefined")
		maxFn = 1;
	this.maxFn = maxFn;
	this.pendings = [];
	this.count = 0;
}

Concurrent.prototype = {
	getMax: function() {
		return Promise.resolve(typeof this.maxFn=="function" ? this.maxFn() : this.maxFn);
	},
	callFn: function() {
		var self = this;
		return function(fn,cancelRequest) {
			return self.getMax()
				.then(function(max) {
					if(self.count < max)
						return self.doCall(fn);
					else {
						return new Promise(function(resolve, reject) {
							const waitingFn = function() {
								return Promise.resolve(fn())
									.then(resolve)
									.catch(reject);
							};
							self.pendings.push(waitingFn);
							if(cancelRequest)
								cancelRequest(function(result) {
									var index = self.pendings.indexOf(waitingFn);
									if(index>=0) {
										self.pendings.splice(index,1);
										resolve(result);
									}
								},function(error) {
									var index = self.pendings.indexOf(waitingFn);
									if(index>=0) {
										self.pendings.splice(index,1);
										reject(error);
									}
								});
						});
					}
				});
		}
	},
	attempt: function() {
		if(this.pendings.length>0) {
			var self = this;
			self.getMax()
				.then(function(max) {
					if(self.count<max)
						self.doCall(self.pendings.shift());
				});
		}
	},
	doCall: function(fn) {
		var self = this;
		this.count++;
		return Promise.resolve(fn())
			.then(function(result) {
				self.count--;
				self.attempt();
				return result;
			})
			.catch(function(err) {
				self.count--;
				self.attempt();
				throw err;
			});
	}
}

module.exports = function(maxFn) {
	var concurrent = new Concurrent(maxFn);
	return concurrent.callFn().bind(concurrent);
}
