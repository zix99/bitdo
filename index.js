#!/usr/bin/env node
const config = require('./config');
const Promise = require('bluebird');
const fs = require('fs');
const _ = require('lodash');
const Exchanges = require('./exchanges');
const Plugins = require('./plugins');
const actions = require('./actions');
const PluginSet = require('./lib/pluginset');
const ui = require('./ui');
const duration = require('./lib/duration');
const db = require('./db');
const log = require('./log');

const context = {
	rules: {
		period: '10m',
		rules: {},
	},
	exchanges: [],
	holdings: {},
	markets: {},
	plugins: null,
	db,
};

let lastRulesDate = 0;

// Load the rules
function reloadRulesFile() {
	if (fs.existsSync(config.rules)) {
		log.info(`Loading rules file ${config.rules}...`);
		try {
			context.rules = JSON.parse(fs.readFileSync(config.rules, {encoding: 'utf8'}));
			lastRulesDate = new Date();
			log.info(`Rules successfully loaded`);
		} catch(err) {
			log.warn('Error loading rules file: ' + err);
		}
	} else {
		log.info(`No rules file to load at ${config.rules}`);
	}
	ui.updateRules(context.rules.rules);
}

function watchRulesFile() {
	if (fs.existsSync(config.rules)) {
		fs.watch(config.rules, {persistent: false}, (event, thing) => {
			if (event === 'change' && (new Date() - lastRulesDate) > 1000) { // Delay to not pick up a save
				reloadRulesFile();
				ui.updateRules(context.rules.rules);
				evaluateRules();
			}
		});
	} else {
		log.warn(`Unable to watch rules file ${config.rules}, does not exist`);
	}
}

reloadRulesFile();


// Initialize plugins
const plugins = context.plugins = new PluginSet();
_.each(config.plugin, pluginName => {
	log.info(`Loading plugin '${pluginName}'...`);
	plugins.push(Plugins.createPlugin(pluginName, context));
});

// Initialize exchanges
_.each(config.exchange, exchangeName => {
	log.info(`Loading exchange '${exchangeName}'...`);
	const exchange = Exchanges.createExchange(exchangeName);
	context.exchanges.push(exchange);
	plugins.event('onExchangeAdd', exchange);
});

// START

function getAllMarkets() {
	return Promise.map(context.exchanges, exchange => {
		return exchange.getMarkets()
			.catch(err => {
				log.warn(`Error fetching market for ${exchange.name}: ${err.message}`);
				return [];
			});
	}).then(_.flatten);
}

function updateTicker() {
	log.info(`Updating ticker data...`);
	return getAllMarkets()
		.map(market => {
			log.debug(`Fetching ticker for ${market.exchange.name} ${market.currency}:${market.relation}...`);
			return market.exchange.getTicker(market.currency, market.relation)
				.catch(err => {
					log.warn(`Error fetching ticker for ${market.exchange.name} on ${market.currency}:${market.relation}`);
					return null;
				});
		}, {concurrency: 2})
		.filter(x => x !== null)
		.then(markets => {
			_.each(markets, market => {
				db.Tickers.create({
					exchange: market.exchange.name,
					currency: market.currency,
					relation: market.relation,
					price: market.price,
				});
				context.markets[market.id] = market;
			});
			return markets;
		});
}

function buildExchangeRateTable(markets) {
	let data = {};
	_.each(markets, ticker => {
		if (_.includes(config.currencies, ticker.relation)) {
			data[`${ticker.currency}-${ticker.relation}`] = ticker.price;
		}
	});
	return data;
}

function getAllHoldings() {
	return Promise.map(context.exchanges, exchange => {
		log.info(`Updating holdings for ${exchange.name}...`);
		return exchange.getHoldings()
			.catch(err => {
				log.warn(`Error fetching holdings from ${exchange.name}: ${err.message}`);
				return [];
			});
	}).then(holdings => _.flatten(holdings));
}

function getRateBetweenCurrencies(rateTable, from, to) {
	if (to === from)
		return 1.0;

	const direct = _.get(rateTable, `${from}-${to}`);
	if (direct !== undefined)
		return direct;

	// Reverse check
	const indirect = _.get(rateTable, `${to}-${from}`);
	if (indirect !== undefined)
		return 1.0 / indirect;

	// Maybe we need to go indirectly... try via BTC
	// TODO: Better implementation of conversions
	const toBtc = _.get(rateTable, `${from}-BTC`);
	const toTarget = _.get(rateTable, `BTC-${to}`);
	if (toBtc !== undefined && toTarget !== undefined)
		return toBtc * toTarget;

	return 0.0;
}

function updateHoldings() {
	return Promise.all([
		getAllHoldings(),
		updateTicker(),
	]).spread((holdings, markets) => {
		const rates = buildExchangeRateTable(markets);
		const sums = _.reduce(config.currencies, (o, i) => {
			o[i] = 0;
			return o;
		}, {});
		_.each(holdings, holding => {
			holding.conversions = {};
			holding.ticker = {};
			_.each(config.currencies, pc => {
				const toPcRate = getRateBetweenCurrencies(rates, holding.currency, pc);
				holding.ticker[pc] = toPcRate;
				sums[pc] += holding.conversions[pc] = holding.balance * toPcRate;
			});

			context.holdings[`${holding.exchange.name}:${holding.currency}`] = holding;

			ui.updateHolding(holding);
			db.Holdings.create({
				exchange: holding.exchange.name,
				currency: holding.currency,
				amount: holding.balance,
				amountUsd: holding.conversions.USD,	//TODO: Ideally, this won't be hardcoded
				amountBtc: holding.conversions.BTC,
			});
		});

		_.each(sums, (val, currency) => {
			db.Historicals.create({
				currency,
				amount: val,
			});
			plugins.event('onHoldingTotal', currency, val);
		});

		log.info('Update complete.');
		plugins.event('onHoldingUpdated');
	});
}

function updateOrders() {
	log.info('Fetching orders...');
	return Promise.map(context.exchanges, exchange => exchange.getOrders())
		.then(_.flatten)
		.then(orders => {
			plugins.event('onOrderUpdated');
			ui.updateOrders(orders);
		}).catch(err => {
			log.error(`Error updating orders: ${err.message}`);
		});
}

function saveRules() {
	log.info(`Save updated rules to ${config.rules}...`);
	lastRulesDate = new Date();
	fs.writeFileSync(config.rules, JSON.stringify(context.rules, null, '\t'));
}

function evaluateRules() {
	const previousState = _.cloneDeep(context.rules);
	return actions.evaluateRuleSet(context)
		.then(ret => {
			ui.updateRules(context.rules.rules);
			if (!_.isEqual(previousState, context.rules))
				saveRules();
		}).catch(err => {
			log.error(`Error evaluating ruleset: ${err}`);
		})
}

let isPolling = false;
function poll() {
	if (isPolling) {
		log.warn('Already polling, wont poll again');
		return;
	}
	isPolling = true;

	log.info('Polling...');
	Promise.all([
		updateHoldings(),
		updateOrders(),
	]).then(() => {
		ui.render();
		return evaluateRules();
	}).catch(err => {
		log.error(err.message);
	}).finally(() => {
		isPolling = false;
	});
}

function main() {
	const period = duration.parse(context.rules.period || '10m');
	log.info(`Polling every ${period.asMinutes()} minutes...`);
	poll();
	setInterval(poll, period.asMilliseconds());
	watchRulesFile();

	ui.bindKey(['f5', 'r'], poll);
}
db.db.sync({force: config.forcemigrate})
	.then(() => main());
