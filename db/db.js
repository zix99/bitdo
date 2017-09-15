const Sequelize = require('sequelize');
const config = require('../config');

console.log(`Opening db ${config.db}...`);

module.exports = new Sequelize('bitdo', null, null, {
	dialect: 'sqlite',
	storage: config.db,
});
