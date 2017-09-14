const config = require('./config');
const path = require('path');
const express = require('express');
const hbs = require('hbs');
const _ = require('lodash');

hbs.registerPartials(`${__dirname}/views/partials`);

function translateHoldingsToChart(holdings) {
	const markets = _.uniq(_.map(holdings, h => `${h.exchange}:${h.currency}`));

	return _.map(markets, market => {
		console.log(market);
		const points = _.map(_.filter(holdings, x => `${x.exchange}:${x.currency}` === market), point => {
			return {date: point.createDate, amount: point.amount};
		});
		return {points, market};
	});
}

module.exports = function(context) {
	const app = express();

	app.set('views', path.join(__dirname, 'views'));
	app.set('view engine', 'hbs');

	app.get('/', (req, res) => {
		context.db.Holdings.findAll()
			.then(holdings => {
				res.render('index', {holdings: translateHoldingsToChart(holdings)});
			});
	});

	app.use((req, res, next) => {
		const err = new Error('Not Found');
		err.status = 404;
		next(err);
	});

	app.use((err, req, res, next) => {
		res.locals.message = err.message;
		res.locals.error = err;

		res.status(err.status || 500).render('error');
	});

	app.listen(config.port, function(){
		console.log(`Web plugin listening on port ${config.port}...`);
	});

	return {};
};
