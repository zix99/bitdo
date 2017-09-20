const Promise = require('bluebird');
const _ = require('lodash');
const util = require('util');

module.exports = {
	evaluate(context, cmd) {
		function help(obj) {
			console.log("Command context:");
			console.log(util.inspect(obj || context, {colors: true, depth:0}));
		}
		function exit() {
			process.exit(0);
		}

		try {
			eval(_.map(context, (val, key) => `var ${key} = context['${key}'];`).join('\n'));
			console.log(cmd);
			Promise.resolve(eval(cmd))
				.then(ret => {
					console.log('\n' + util.inspect(ret, {colors: true, depth:1}));
				}).catch(err => {
					console.err(`Error evaluating statement: ${err.message}`);
				});
		} catch(err) {
			console.err(err.message);
		}
	}
}
