const duration = require('../lib/duration');
const moment = require('moment');
const _ = require('lodash');

module.exports = function(market, context){
	if (!this.period)
		throw Error('Average metric needs period config');
	const period = duration.parse(this.period);

	return context.db.Tickers.findAll({
		where: {
			createdAt: {$gt: moment().subtract(period).toDate()},
			exchange: market.exchange.name,
			currency: market.currency,
			relation: market.relation,
		}
	}).then(results => {
		if (!results || results.length === 0)
			throw Error('Not enough results to compute average');
		return _.sumBy(results, x => x.price) / results.length;
	});
};
