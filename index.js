#!/usr/bin/env node
const log = require('./lib/logger');
const Promise = require('bluebird');
const fs = require('fs');
const _ = require('lodash');
const Exchanges = require('./exchanges');
const Plugins = require('./plugins');
const PluginSet = require('./lib/pluginset');
//const ui = require('./ui');
const duration = require('./lib/duration');

// Load the rules
let rules = JSON.parse(fs.readFileSync('rules.json', {encoding: 'utf8'}));

// Initialize plugins
const plugins = new PluginSet();
_.each(rules.plugins, pluginName => {
	log.info(`Loading plugin '${pluginName}'...`);
	plugins.push(Plugins.createPlugin(pluginName));
});

// Initialize exchanges
const exchanges = [];
_.each(rules.exchanges, exchangeName => {
	log.info(`Loading exchange '${exchangeName}'...`);
	const exchange = Exchanges.createExchange(exchangeName);
	exchanges.push(exchange);
	plugins.event('onExchangeAdd', exchange);
});

// START

const holdings = {};

function getAllMarkets() {
	return Promise.map(exchanges, exchange => {
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
	const TARGETS = ['USD', 'BTC'];
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
	return Promise.map(exchanges, exchange => {
		return exchange.getHoldings();
	}).then(holdings => _.flatten(holdings));
}

function getRateBetweenCurrencies(rateTable, from, to) {
	if (to === from)
		return 1.0;

	const direct = _.get(rateTable, `${from}-${to}`);
	if (direct !== null)
		return direct;

	// Maybe we need to go indirectly... try via BTC
	const toBtc = _.get(rateTable, `${from}-BTC`);
	const toTarget = _.get(rateTable, `BTC-${to}`);
	if (toBtc !== null && toTarget !== null)
		return toBtc * toTarget;

	return 0.0;
}

function updateHoldings() {
	return Promise.all([
		getHoldings(),
		buildExchangeRateTable(),
	]).spread((holdings, rates) => {
		_.each(holdings, holding => {
			const toBtc = getRateBetweenCurrencies(rates, holding.currency, 'BTC'); //TODO: Configure primary currencies
			const toUsd = getRateBetweenCurrencies(rates, holding.currency, 'USD');

			holding.balance_btc = holding.balance * toBtc;
			holding.balance_usd = holding.balance * toUsd;

			console.dir(holding);
		});
	});
}

function poll() {
	log.info('Polling...');
	Promise.all([
		updateHoldings(),
	]).then(() => {
		//ui.update();
	});
}

function main() {
	const period = duration.parse(rules.period);
	log.info(`Polling every ${period.asMinutes()} minutes...`);
	poll();
	setInterval(poll, period.asMilliseconds());
}
main();
