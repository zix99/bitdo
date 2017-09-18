#!/usr/bin/env node
const config = require('./config');
const Promise = require('bluebird');
const fs = require('fs');
const _ = require('lodash');
const Exchanges = require('./exchanges');
const Plugins = require('./plugins');
const PluginSet = require('./lib/pluginset');
const ui = require('./ui');
const duration = require('./lib/duration');
const db = require('./db');
const log = require('./log');

const context = {
	rules: {},
	exchanges: [],
	db,
};

// Load the rules
function reloadRulesFile() {
	log.info(`Loading rules file ${config.rules}...`);
	try {
		context.rules = JSON.parse(fs.readFileSync(config.rules, {encoding: 'utf8'}));
		log.info(`Rules successfully loaded`);
	} catch(err) {
		log.warn('Error loading rules file: ' + err);
	}
	ui.updateRules(context.rules.rules);
}
fs.watch(config.rules, {persistent: false}, (event) => {
	if (event === 'change') {
		reloadRulesFile();
	}
});
reloadRulesFile();


// Initialize plugins
const plugins = new PluginSet();
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
	return getAllMarkets()
		.map(market => {
			log.debug(`Fetching ticker for ${market.exchange.name} ${market.currency}:${market.relation}...`);
			return market.exchange.getTicker(market.currency, market.relation)
				.catch(err => {
					log.warn(`Error fetching ticker for ${market.exchange.name} on ${market.currency}:${market.relation}`);
					return null;
				});
		}, {concurrency: 2});
}

function buildExchangeRateTable() {
	const TARGETS = config.currencies;
	return updateTicker()
		.then(tickers => {
			let data = {};
			_.each(tickers, ticker => {
				if (_.includes(TARGETS, ticker.relation)) {
					data[`${ticker.currency}-${ticker.relation}`] = ticker.price;
				}
			});
			return data;
		});
}

function getHoldings() {
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
		getHoldings(),
		buildExchangeRateTable(),
	]).spread((holdings, rates) => {
		const sums = _.reduce(config.currencies, (o, i) => {
			o[i] = 0;
			return o;
		}, {});
		_.each(holdings, holding => {
			holding.updatedAt = new Date();
			holding.conversions = {};
			holding.ticker = {};
			_.each(config.currencies, pc => {
				const toPcRate = getRateBetweenCurrencies(rates, holding.currency, pc);
				holding.ticker[pc] = toPcRate;
				sums[pc] += holding.conversions[pc] = holding.balance * toPcRate;
			})
			console.dir(holding);
			ui.updateHolding(holding);
			db.Holdings.create({
				exchange: holding.exchange.name,
				currency: holding.currency,
				amount: holding.balance,
				amountUsd: holding.conversions.USD,	//TODO: Ideally, this won't be hardcoded
				amountBtc: holding.conversions.BTC,
			})
		});

		_.each(sums, (val, currency) => {
			db.Historicals.create({
				currency,
				amount: val,
			})
		});

		log.info('Update complete.');
	});
}

function updateOrders() {
	log.info('Fetching orders...');
	return Promise.map(context.exchanges, exchange => exchange.getOrders())
		.then(_.flatten)
		.then(orders => {
			ui.updateOrders(orders);
		}).catch(err => {
			log.error(`Error updating orders: ${err.message}`);
		});
}

function evaluateRules() {
	return Promise.resolve();
}

function poll() {
	log.info('Polling...');
	Promise.all([
		updateOrders(),
		updateHoldings(),
	]).then(() => {
		ui.render();
		return evaluateRules();
	}).catch(err => {
		log.error(err.message);
	});
}

function main() {
	const period = duration.parse(context.rules.period);
	log.info(`Polling every ${period.asMinutes()} minutes...`);
	poll();
	setInterval(poll, period.asMilliseconds());
}
db.db.sync({force: config.forcemigrate})
	.then(() => main());
