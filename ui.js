const blessed = require('blessed');
const contrib = require('blessed-contrib');
const _ = require('lodash');
const moment = require('moment');
const config = require('./config');
const format = require('./lib/format');
const repl = require('./lib/repl');
const chalk = require('chalk');

const screen = blessed.Screen({
	smartCSR: true
});

const holdingTable = contrib.table({
	keys: true,
	width: '60%',
	height: '50%',
	interactive: true,
	label: 'Holdings',
	columnWidth: [10,8,4, 12, 12, 12, 12, 12, 8],
	columnSpacing: 4,
	border: {
		type: 'line',
	},
	fg: 'white',
});
screen.append(holdingTable);

const ruleTable = blessed.ListTable({
	width: '40%',
	height: '50%-1',
	left: '60%',
	top: 1,
	border: {
		type: 'line',
	},
	style : {
		header: {
			bold: true,
			bg: 'green',
		}
	},
});
screen.append(ruleTable);

const header = blessed.Text({
	top: 0,
	left: '60%+1',
	width: '40%-2',
	height: 1,
	content: 'BitDo',
});
screen.append(header);

const clock = blessed.Text({
	left: '100%-14',
	width: 14,
	height: 1,
});
screen.append(clock);

const orderTable = blessed.ListTable({
	width: '60%',
	height: '50%',
	top: '50%',
	border: {
		type: 'line',
	},
	style : {
		header: {
			bold: true,
			bg: 'blue',
		}
	},
});
screen.append(orderTable);

const log = blessed.Log({
	width: '40%',
	height: '50%-2',
	left: '60%',
	top: '50%',
	border: {
		type: 'line',
	},
	style: {
		border: {
			fg: '#f0f0f0',
		}
	},
	tags: true,
	scrollback: 10000,
	label: 'Log Messages'
});
screen.append(log);

const command = blessed.Textbox({
	width: '40%',
	height: 3,
	top: '100%-3',
	left: '60%',
	border: {
		type: 'line',
	},
	keys: true,
	inputOnFocus: true,
})
screen.append(command);
command.focus();
let evalContext = {};
command.on('submit', (text) => {
	command.clearValue();
	if (text) {
		repl.evaluate(evalContext, text);
		command.focus();
	}
	screen.render();
});
command.on('cancel', () => {
	command.clearValue();
	screen.render();
})
screen.key(['enter'], () => {
	command.focus();
});

screen.key(['C-c'], function(ch, key) {
  return process.exit(0);
});

screen.key(['j'], function() {
	log.scroll(-10);
});
screen.key(['k'], function() {
	log.scroll(10);
});
screen.key('h', function(){
	console.log([
		'Help:',
		'h       See this message again',
		'j/k     Navigate log messages',
		'enter   Enable command interface',
		'F5      Refresh holdings, run rules',
	].join('\n'));
});
screen.render();

function directionalColor(val) {
	if (val > 0.0)
		return chalk.greenBright;
	if (val < 0.0)
		return chalk.redBright;
	return chalk.yellow;
}

const holdingData = {};
function updateHoldingsTable() {
	let sums = {BTC: 0, USD: 0};
	const data = _.map(_.orderBy(holdingData, x => x.conversions[config.primary], 'desc'), (v, key) => {
		sums.BTC += v.conversions.BTC;
		sums.USD += v.conversions.USD;
		return [
			moment(v.updatedAt).format('Do hA'),
			v.exchange.name,
			v.currency,
			chalk.yellow(format.number(v.ticker.USD)),
			chalk.bold.blueBright(format.number(v.balance)),
			format.number(v.hold),
			format.number(v.conversions.BTC),
			chalk.blue(format.number(v.conversions.USD)),
			directionalColor(v.delta)(format.number(v.delta)),
		];
	})
	data.unshift([]);
	data.unshift(['', 'Total', '', '', '', '', format.number(sums.BTC), format.number(sums.USD)]);

	holdingTable.setData({
		headers: ['Updated', 'Exch', 'Sym', 'Last USD', 'Owned', 'Hold', 'BTC', 'USD', 'Delta'],
		data,
	});
}
updateHoldingsTable();

setInterval(function(){
	clock.content = chalk.cyan(moment().format('LTS'));
	screen.render();
}, 1000);

module.exports = {
	bindKey(key, action) {
		screen.key(key, action);
	},

	log(s) {
		log.log(s);
		screen.render();
	},

	render() {
		screen.render();
	},

	setHeader(text) {
		header.content = `${chalk.bold.green('BitDo')}: ${text}`;
		screen.render();
	},

	setEvalContext(c) {
		evalContext = c;
	},

	updateHolding(holding) {
		let lastUSD = _.get(holdingData, `${holding.id}.ticker.USD`, holding.ticker.USD || 0);
		holdingData[holding.id] = holding;
		holdingData[holding.id].delta = holding.ticker.USD - lastUSD;
		updateHoldingsTable();
		screen.render();
	},

	updateOrders(orders) {
		const rows = _.flatten([
			_.map(_.orderBy(_.filter(orders, x => x.status === 'O'), x => x.date, 'desc'), order => {
				return [
					order.status,
					moment(order.date).format('M/D H:mm'),
					order.exchange.name,
					order.product,
					order.side,
					order.type,
					format.number(order.size),
					format.number(order.price),
					'N/A',
				]
			}),
			[[]],
			_.map(_.orderBy(_.filter(orders, x => x.status !== 'O'), x => x.date, 'desc'), order => {
				return [
					order.status,
					moment(order.date).format('M/D H:mm'),
					order.exchange.name,
					order.product,
					order.side,
					order.type,
					format.number(order.size),
					format.number(order.price),
					format.number(order.fee)
				]
			}),
		]);
		rows.unshift(['', 'Created', 'Exchange', 'Product', 'Side', 'Type', 'Size', 'Price', 'Fee']);
		orderTable.setData(rows);
		screen.render();
	},

	updateRules(rules) {
		if (!rules)
			return;

		const rows = _.map(rules, rule => {
			if (rule._ignore)
				return null;
			return [
				rule._symbol || '?',
				rule.market,
				rule.action,
				rule.comparator + format.short(_.get(rule, '_meta.target', rule.triggerprice)),
				rule.amount,
				format.short(_.get(rule, '_meta.analytics', 0)) + '->' + format.short(_.get(rule, '_meta.activate', 0)) + '/' + format.short(_.get(rule, '_meta.rollback', 0))
			];
		});
		rows.unshift(['', 'Product', 'Action', 'Trigger', 'Amount', 'A/D']);
		ruleTable.setData(_.filter(rows, x => x !== null));
		screen.render();
	}
};