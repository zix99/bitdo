const Sequelize = require('sequelize');

module.exports = new Sequelize('bitdo', null, null, {
	dialect: 'sqlite',
	storage: 'db.sqlite',
});
