const Sequelize = require('sequelize');
const db = require('./db');

const Historicals = db.define('historicals', {
	currency: Sequelize.STRING,
	amount: Sequelize.DOUBLE,
});

module.exports = Historicals;
