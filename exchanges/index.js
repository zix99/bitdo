const _ = require('lodash');
const memoize = require('memoizee');

function Exchange(name, impl) {
	this.name = name;
	this._impl = impl;

	this.getMarkets = memoize(this.__getMarkets, {
		maxAge: 1000 * 60 * 60 * 6 // 6 hours
	});
};

Exchange.prototype.getTicker = function (currency, relation) {
	/*
	{
		price: float:data.price,
		volume: float:data.volume,
	}
	*/
	return this._impl.getTicker(currency, relation)
		.then(ticker => _.assign({exchange: this, currency, relation}, ticker));
};

Exchange.prototype.getHoldings = function () {
	/*
	[{
		id: arbitrary-id,
		currency: 3-letter currency symbol,
		balance: float:balance,
		available: float:avail,
		hold: float:hold,
	}]
	*/
	return this._impl.getHoldings()
		.map(holding => _.assign({exchange: this}, holding));
}

Exchange.prototype.__getMarkets = function() {
	/*[{
		currency: product.base_currency,
		relation: product.quote_currency,
	}]*/
	return this._impl.getMarkets()
		.map(market => _.assign({exchange: this}, market));
}

module.exports = {
	createExchange(name) {
		// Simple for now, will wrap in the future.
		return new Exchange(name, require(`./${name}`));
	}
};
