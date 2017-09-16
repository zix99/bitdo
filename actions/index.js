const _ = require('lodash');

function instantiateActionByName(name) {
	return require(`./${name}`);
}

const lib = {
	evaluateAction(rule, context) {
		const action = instantiateActionByName(rule.action);
		return action(_.clone(rule), context);
	},

	evaulateRuleSet(context) {
		if (!context.rules)
			return Promise.reject('No rules to evaluate');

		return Promise.mapSeries(context.rules, rule => {
			return lib.evaluateAction(rule, context)
				.then(result => {
					return result ? result : rule;
				}).catch(err => {
					log.warn(`Error evaluating rule ${rule}: ${err}`);
					return rule;
				});
		});
	}
};

module.exports = lib;
