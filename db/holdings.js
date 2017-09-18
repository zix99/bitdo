const Sequelize = require('sequelize');
const db = require('./db');

const Holdings = db.define('holdings', {
	exchange: Sequelize.STRING,
	currency: Sequelize.STRING,
	amount: Sequelize.DOUBLE,
	amountBtc: Sequelize.DOUBLE,
	amountUsd: Sequelize.DOUBLE,
}, {
	indexes: [
		{fields: ['exchange', 'currency']},
		{fields: ['createdAt']},
	]
});

module.exports = Holdings;
