const _ = require('lodash');
const Promise = require('bluebird');
const log = require('../log');
const analysis = require('../analysis');

/**
Rule specificiation:
{
	"product" : "gdax:BTC-USD",	// Product to monitor against
	"action" : "buy-limit",		// Action to trigger
	"mode" : "remove",			// How it reacts to the trigger being completed [keep, remove, decrement]
	"triggerprice" : "100",		// RelPrice to trigger at
	"compareprice" : "last",	// What to compare the price to (analytics name)
	"comparator" : "<",			// How to compare target price and trigger price
	"activate" : "3%",			// What threshold to "activate" at (send to the exchange)
	"amount" : "100%"			// How much money, as relative to holdings, to execute with, relative to asking price

	// Optional:
	description: "Something to help you remember",

	// Internal
	_state: "State to display in UI",
	_symbol: "Symbol for state",
	_ignore: "Ignore the statement",
	_orderId: "123", // Id for order to keep track of it
}
**/

/**
Actions:
function(rule, product, context){}

Product: {
	createLimitBuy();
	createLimitSell();
}
Returns: Modified rule, rejected=error

**/

const RULE_DEFAULTS = {
	mode: 'remove',
	compareprice: 'last',
	activate: '3%',
	amount: '100%',
};

// Hydrate rule with defaults, if they don't exist
function hydrateWithDefaults(rule) {
	_.each(RULE_DEFAULTS, (val, key) => {
		if (!_.has(rule, key))
			rule[key] = val;
	});
}

// Parses a `val` in relation to a comparison
// Can be constant, percentage offset, constant offset, with tolerance (randomness).
// eg: 5, +5, -5, +5%, -5%, +5%~2, +5~1
const RELNUM_REGEX = /([+-])?(\d+)(%)?(?:~(\d+))?/i;
function getRelativeNumber(val, comparison) {
	const match = ('' + val).match(RELNUM_REGEX);
	if (!match)
		throw Error(`Unable to parse relnum of '${val}'`);

	const [a, prefix, base, operator, tolerance] = match;
	let result = parseInt(base);

	if (operator === '%') {
		const direction = prefix || '+';
		result = comparison + (base / 100.0) * comparison * (direction === '-' ? -1 : 1);
	} else if (prefix === '-') {
		result = comparison - result;
	} else if (prefix === '+') {
		result = comparison + result;
	}

	if (tolerance) {
		result += (Math.random() * 2 - 1) * tolerance;
	}

	return result;
}

function instantiateActionByName(name) {
	return require(`./${name}`);
}

function compareVals(left, compartor, right) {
	switch(compartor) {
		case '<': return left < right;
		case '<=': return left <= right;
		case '>': return left > right;
		case '>=': return left >= right;
		case '=': return left === right;
	}
	return false;
}

const lib = {
	evaluateAction(rule, market, context) {
		log.info(`Evaluating rule ${rule.description || rule.action}`);
		hydrateWithDefaults(rule);

		return analysis.evaluateMetric(rule.compareprice, market, context)
			.then(analyticsPrice => {
				const targetPrice = getRelativeNumber(rule.triggerprice, analyticsPrice);

				rule._state = `${targetPrice - analyticsPrice}`;
				rule._symbol = 'W';

				if (compareVals(analyticsPrice, rule.comparator, targetPrice)) {
					rule._symbol = 'T';

					const action = instantiateActionByName(rule.action);
					return action(rule, context);
				} else {
					return Promise.resolve(false);
				}
			});
	},

	evaluateRuleSet(context) {
		if (!context.rules)
			return Promise.reject('No rules to evaluate');

		return Promise.mapSeries(context.rules.rules, rule => {
			const market = context.markets[rule.market];
			if (!market)
				throw Error(`Unable to find market ${rule.market}`);

			return lib.evaluateAction(rule, market, context)
				.catch(err => {
					log.warn(`Error evaluating rule ${rule}: ${err}`);
					return rule;
				});
		});
	}
};

module.exports = lib;
