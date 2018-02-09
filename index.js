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

class Concurrent {
	constructor(maxFn=1) {
		this.maxFn = maxFn;
		this.pendings = [];
		this.count = 0;
	}
	getMax() {
		return Promise.resolve(typeof this.maxFn=="function" ? this.maxFn() : this.maxFn);
	}
	callFn() {
		var self = this;
		return (fn,cancelRequest) => {
			return self.getMax()
				.then((max)=>{
					if(self.count < max)
						return self.doCall(fn);
					else {
						return new Promise((resolve, reject) => {
							const waitingFn = ()=>{
								return Promise.resolve(fn())
									.then(resolve)
									.catch(reject);
							};
							self.pendings.push(waitingFn);
							if(cancelRequest)
								cancelRequest((result)=>{
									var index = self.pendings.indexOf(waitingFn);
									if(index>=0) {
										self.pendings.splice(index,1);
										resolve(result);
									}
								},(error)=>{
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
	}
	attempt() {
		if(this.pendings.length>0) {
			var self = this;
			self.getMax()
				.then((max)=>{
					if(self.count<max)
						self.doCall(self.pendings.shift());
				});
		}
	}
	doCall(fn) {
		var self = this;
		this.count++;
		return Promise.resolve(fn())
			.then((result)=>{
				self.count--;
				self.attempt();
				return result;
			})
			.catch((err)=>{
				self.count--;
				self.attempt();
				throw err;
			});
	}
}

module.exports = function(...args) {
	var concurrent = new Concurrent(...args);
	return concurrent.callFn().bind(concurrent);
}
