const Promise = require('bluebird');

module.exports = (rule, product, context) => {
	if (!rule._orderId) {
		//product.exchange.createSellOrder(...).then..
		rule._orderId = 'abcdef';
		rule._symbol = 'O';
		return Promise.resolve(true);
	} else {
		// Already activated...
	}
	return Promise.resolve(false);
};
