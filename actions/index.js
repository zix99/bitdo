const _ = require('lodash');
const Promise = require('bluebird');
const log = require('../log');
const config = require('../config');
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
	"activate" : 0.03,			// What threshold to "activate" at (send to the exchange), percentage
	"rollback" : 0.05,			// Value at which the order is canceled
	"amount" : "100%"			// How much money, as relative to holdings, to execute with, relative to asking price

	// Optional:
	description: "Something to help you remember",

	// Internal
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
	activate: 0.03,
	rollback: 0.05,
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

function compareVals(left, comparator, right) {
	switch(comparator) {
		case '<': return left < right;
		case '<=': return left <= right;
		case '>': return left > right;
		case '>=': return left >= right;
		case '=': return left === right;
	}
	return false;
}

function getDirectionality(comparator) {
	switch(comparator) {
		case '<': return -1;
		case '<=': return -1;
		case '>': return 1;
		case '>=': return 1;
	}
	return 0;
}

const lib = {
	evaluateAction(rule, market, context) {
		if (rule._ignore)
			return Promise.resolve(false);

		log.info(`Evaluating rule ${rule.description || rule.action}`);
		hydrateWithDefaults(rule);

		return analysis.evaluateMetric(rule.compareprice, market, context)
			.then(analyticsPrice => {
				const targetPrice = getRelativeNumber(rule.triggerprice, analyticsPrice);
				const activatePrice = targetPrice - rule.activate * targetPrice * getDirectionality(rule.comparator);
				const rollbackPrice = targetPrice - rule.rollback * targetPrice * getDirectionality(rule.comparator);

				rule._meta = {
					activate: activatePrice,
					rollback: rollbackPrice,
					target: targetPrice,
					analytics: analyticsPrice,
				};

				if (rule._orderId) {
					// Order has already been created
					if (compareVals(rollbackPrice, rule.comparator, analyticsPrice)) {
						log.info(`Rule regressed, deleting order...`);
						delete rule._orderId;
						rule._symbol = 'R'; // regressed
					} else {
						let filled = false;
						if (rule._simulated) {
							if (compareVals(analyticsPrice, rule.comparator, targetPrice)) {
								// Filled!
								log.info(`ORDER EXECUTED: ${JSON.stringify(rule)}`);
								filled = true;
							}
						} else {
							// Get order status (fulled or non-filled)
							// if filled, process 'mode' (remove, decrement, etc)
						}


						if (filled) {
							rule._symbol = 'F';

							const mode = rule.mode || 'once';
							switch(mode) {
								case 'forever':
									delete rule._orderId;
									delete rule._simulated;
									break;
								case 'once':
								default:
									rule._ignore = true;
									break;
							}
						}
					}
				} else if (compareVals(analyticsPrice, rule.comparator, activatePrice)) {
					// Crossed the threshold for activation
					log.info(`Rule crossed threshold, placing order...`);
					rule._symbol = 'A'; // activated
					if (config.simulate) {
						rule._orderId = 'SIM';
						rule._simulated = true;
					} else {
						rule._orderId = 'abc'; //TODO actually order...
					}
				} else {
					rule._symbol = 'W'; // watching
				}

				return true;
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
