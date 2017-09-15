let config = require('yargs')
	.usage('Usage: $0 [options]')
	.help('h')
	.alias('h', 'help')
	.array('currencies')
	.describe('currencies', 'A set of primary currencies to convert to')
	.default('currencies', ['BTC', 'USD'])
	.describe('db', 'Filename of database to store history')
	.default('db', 'db.sqlite')
	.string('db')
	.boolean('v')
	.alias('v', 'verbose')
	.describe('v', 'Display debug text in log')
	.argv;

config.primary = config.currencies[0] || 'USD';

module.exports = config;
