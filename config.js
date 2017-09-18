const _ = require('lodash');
const fs = require('fs');

const config = require('yargs')
	.usage('Usage: $0 [options]')
	.help('h')
	.alias('h', 'help')
	.array('currencies')
	.describe('currencies', 'A set of primary currencies to convert to')
	.default('currencies', ['USD', 'BTC'])
	.describe('db', 'Filename of database to store history')
	.default('db', 'sqlite://db.sqlite')
	.string('db')
	.describe('c', 'Specify an external JSON config file')
	.alias('c', 'conf')
	.default('c', 'bitdo.conf')
	.string('c')
	.describe('r', 'Specify a rules configuration filename to monitor')
	.alias('r', 'rules')
	.default('r', 'rules.json')
	.string('r')
	.describe('exchange', 'Specify an exchange plugin to load')
	.default('exchange', ['gdax'])
	.array('exchange')
	.describe('plugin', 'Load a plugin')
	.default('plugin', ['web'])
	.array('plugin')
	.boolean('v')
	.alias('v', 'verbose')
	.describe('v', 'Display debug text in log')
	.describe('noredirect', 'Do not redirect stdout/stderr to UI')
	.boolean('noredirect')
	.describe('forcemigrate', 'Recreate the database, deleting all historical data')
	.boolean('forcemigrate')
	.describe('log', 'Specify output filename for logs')
	.default('log', 'bitdo.log')
	.string('log')
	.argv;

if (fs.existsSync(config.conf)) {
	_.assign(config, JSON.parse(fs.readFileSync(config.conf)));
}

config.primary = config.currencies[0] || 'USD';

module.exports = config;
