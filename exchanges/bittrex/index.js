const axios = require('axios');
const uuid = require('uuid/v4');
const Promise = require('bluebird');
const config = require('./config');


module.exports = {
	getHoldings() {
		return Promise.resolve([]);
	},

	getMarkets() {
		return Promise.resolve(axios.get(`${config.host}/api/v1.1/public/getmarkets`))
			.then(resp => resp.data.result)
			.map(market => {
				return {
					currency: market.MarketCurrency,
					relation: market.BaseCurrency,
				};
			});
	},

	getTicker(currency, relation) {
		return Promise.resolve(axios.get(`${config.host}/api/v1.1/public/getticker?market=${relation}-${currency}`))
			.then(resp => resp.data)
			.then(ticker => {
				if (!ticker.success)
					throw new Error(`Unable to retrieve ticker for ${relation}-${currency}`);
				return {
					price: ticker.result.Last,
					volume: null,
				};
			});
	}
};
