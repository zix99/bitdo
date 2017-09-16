const Sequelize = require('sequelize');
const db = require('./db');

const Tickers = db.define('tickers', {
	exchange: Sequelize.STRING,
	currency: Sequelize.STRING,
	relation: Sequelize.STRING,
	price: Sequelize.DOUBLE,
});

module.exports = Tickers;
