#!/usr/bin/env node
const log = require('./lib/logger');
const fs = require('fs');
const exchanges = require('./exchanges');
//const ui = require('./ui');
const duration = require('./lib/duration');

//exchanges.getExchange(config.exchange.name, config.exchange.config);


let rules = JSON.parse(fs.readFileSync('rules.json', {encoding: 'utf8'}));

function poll() {
	log.info('Polling...');
}

function main() {
	const period = duration.parse(rules.period);
	log.info(`Polling every ${period.asMinutes()} minutes...`);
	poll();
	setInterval(poll, period.asMilliseconds());
}
main();
