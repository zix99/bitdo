#!/usr/bin/env node
const log = require('./log');
const Promise = require('bluebird');
const fs = require('fs');
const _ = require('lodash');
const Exchanges = require('./exchanges');
const Plugins = require('./plugins');
const PluginSet = require('./lib/pluginset');
const ui = require('./ui');
const duration = require('./lib/duration');
const db = require('./db');

const context = {
	rules: {},
	exchanges: [],
	db,
};

// Load the rules
context.rules = JSON.parse(fs.readFileSync('rules.json', {encoding: 'utf8'}));

// Initialize plugins
const plugins = new PluginSet();
_.each(context.rules.plugins, pluginName => {
	log.info(`Loading plugin '${pluginName}'...`);
	plugins.push(Plugins.createPlugin(pluginName, context));
});

// Initialize exchanges
_.each(context.rules.exchanges, exchangeName => {
	log.info(`Loading exchange '${exchangeName}'...`);
	const exchange = Exchanges.createExchange(exchangeName);
	context.exchanges.push(exchange);
	plugins.event('onExchangeAdd', exchange);
});

// START

function getAllMarkets() {
	return Promise.map(context.exchanges, exchange => {
		return exchange.getMarkets();
	}).then(_.flatten);
}

function updateTicker() {
	return getAllMarkets()
		.map(market => {
			return market.exchange.getTicker(market.currency, market.relation);
		});
}

function buildExchangeRateTable() {
	const TARGETS = context.rules.primary_currencies;
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
		return exchange.getHoldings();
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
		_.each(holdings, holding => {
			holding.conversions = {};
			_.each(context.rules.primary_currencies, pc => {
				const toPcRate = getRateBetweenCurrencies(rates, holding.currency, pc);
				holding.conversions[pc] = holding.balance * toPcRate;
			})
			console.dir(holding);
			ui.updateHolding(holding);
			db.Holdings.create({
				exchange: holding.exchange.name,
				currency: holding.currency,
				amount: holding.balance,
				amountUsd: holding.conversions.USD,
				amountBtc: holding.conversions.BTC,
			})
		});
	});
}

function poll() {
	log.info('Polling...');
	Promise.all([
		updateHoldings(),
	]).then(() => {
		ui.render();
	});
}

function main() {
	const period = duration.parse(context.rules.period);
	log.info(`Polling every ${period.asMinutes()} minutes...`);
	poll();
	setInterval(poll, period.asMilliseconds());
}
db.db.sync().then(() => main());
