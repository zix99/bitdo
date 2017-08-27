#!/usr/bin/env node
const exchanges = require('./exchanges');
const ui = require('./ui');


const config = require('./rules.example.js');
exchanges.getExchange(config.exchange.name, config.exchange.config);