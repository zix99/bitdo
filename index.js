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

function updateHoldings() {
	return Promise.map(exchanges, exchange => {
		return exchange.getHoldings()
			.then(holdings => {
				_.each(holdings, holding => plugins.event('onHoldingUpdate', holding));
				return holdings;
			});
	});
}

function poll() {
	log.info('Polling...');
	Promise.all([
		updateTicker().tap(console.dir),
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
