const blessed = require('blessed');
const contrib = require('blessed-contrib');
const _ = require('lodash');
const numeral = require('numeral');

const NUMF = "0,0.0000";
function formatNum(n) {
	if (Math.abs(n) < 0.0001)
		return '0';
	return numeral(n || 0).format(NUMF);
}

const screen = blessed.Screen({
	smartCSR: true
});

const holdings = contrib.table({
	keys: true,
	width: '60%',
	height: '50%',
	interactive: true,
	label: 'Holdings',
	columnWidth: [8,8,4, 12, 12, 12],
	columnSpacing: 4,
	border: {
		type: 'line',
	}
});
screen.append(holdings);
holdings.focus();

const holdingData = {};
function updateHoldingsTable() {
	let sums = {BTC: 0, USD: 0};
	const data = _.map(_.orderBy(holdingData, x => x.conversions.USD, 'desc'), (v, key) => {
		sums.BTC += v.conversions.BTC;
		sums.USD += v.conversions.USD;
		return [
			'', v.exchange.name, v.currency,
			formatNum(v.balance), formatNum(v.conversions.BTC), formatNum(v.conversions.USD)
		];
	})
	data.unshift([]);
	data.unshift(['', 'Total', '', '', formatNum(sums.BTC), formatNum(sums.USD)]);

	holdings.setData({
		headers: ['Date', 'Exch', 'Sym', 'Amt', 'BTC', 'USD'],
		data,
	});
}
updateHoldingsTable();

const log = blessed.Log({
	width: '40%',
	height: '100%',
	left: '60%',
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
	log.scroll(-1);
});
screen.key(['k'], function() {
	log.scroll(1);
});

screen.render();

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
};