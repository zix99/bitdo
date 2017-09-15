const blessed = require('blessed');
const contrib = require('blessed-contrib');
const _ = require('lodash');
const numeral = require('numeral');
const moment = require('moment');

const NUMF = "0,0.0000";
function formatNum(n) {
	if (Math.abs(n) < 0.0001)
		return '0';
	return numeral(n || 0).format(NUMF);
}

const screen = blessed.Screen({
	smartCSR: true
});

const holdingTable = contrib.table({
	keys: true,
	width: '60%',
	height: '50%',
	interactive: true,
	label: 'Holdings',
	columnWidth: [10,8,4, 12, 12, 12, 12],
	columnSpacing: 4,
	border: {
		type: 'line',
	},
});
screen.append(holdingTable);
holdingTable.focus();

const ruleTable = blessed.ListTable({
	width: '40%',
	height: '50%',
	left: '60%',
	top: '0',
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
	height: '50%',
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
log.focus();

screen.key(['C-c'], function(ch, key) {
  return process.exit(0);
});

screen.key(['j'], function() {
	log.scroll(-10);
});
screen.key(['k'], function() {
	log.scroll(10);
});

screen.render();



const holdingData = {};
function updateHoldingsTable() {
	let sums = {BTC: 0, USD: 0};
	const data = _.map(_.orderBy(holdingData, x => x.conversions.USD, 'desc'), (v, key) => {
		sums.BTC += v.conversions.BTC;
		sums.USD += v.conversions.USD;
		return [
			moment(v.updatedAt).format('Do hA'),
			v.exchange.name,
			v.currency,
			formatNum(v.ticker.USD),
			formatNum(v.balance),
			formatNum(v.conversions.BTC),
			formatNum(v.conversions.USD)
		];
	})
	data.unshift([]);
	data.unshift(['', 'Total', '', '', '', formatNum(sums.BTC), formatNum(sums.USD)]);

	holdingTable.setData({
		headers: ['Updated', 'Exch', 'Sym', 'Last', 'Owned', 'BTC', 'USD'],
		data,
	});
}
updateHoldingsTable();

module.exports = {
	log(s) {
		log.log(s);
		screen.render();
	},

	render() {
		screen.render();
	},

	updateHolding(holding) {
		holdingData[holding.id] = holding;
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
					formatNum(order.size),
					formatNum(order.price),
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
					formatNum(order.size),
					formatNum(order.price),
					formatNum(order.fee)
				]
			}),
		]);
		rows.unshift(['', 'Created', 'Exchange', 'Product', 'Side', 'Type', 'Size', 'Price', 'Fee']);
		orderTable.setData(rows);
		screen.render();
	}
};