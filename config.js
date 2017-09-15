module.exports = require('yargs')
	.usage('Usage: $0 [options]')
	.help('h')
	.alias('h', 'help')
	.array('currencies')
	.help('currencies', 'A set of primary currencies to convert to')
	.default('currencies', ['BTC', 'USD'])
	.describe('db', 'Filename of database to store history')
	.default('db', 'db.sqlite')
	.string('db')
	.argv;

process.exit(1);