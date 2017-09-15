const Sequelize = require('sequelize');
const config = require('../config');
const log = require('../log');

console.log(`Opening db ${config.db}...`);

module.exports = new Sequelize('bitdo', null, null, {
	dialect: 'sqlite',
	storage: config.db,
	logging: txt => log.debug(txt),
});
