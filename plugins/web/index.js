const config = require('./config');
const path = require('path');
const express = require('express');
const hbs = require('hbs');
const moment = require('moment');
const _ = require('lodash');

hbs.registerPartials(`${__dirname}/views/partials`);

module.exports = function(context) {
	const app = express();

	app.set('views', path.join(__dirname, 'views'));
	app.set('view engine', 'hbs');

	app.get('/', (req, res) => {
		context.db.Historicals.findAll({
			where: {
				currency: 'USD',
				createdAt: {$gt: moment().subtract(30, 'days').toDate()},
			},
			order: [
				['createdAt', 'ASC'],
			]
		}).then(history => {
			res.render('index', {history});
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
