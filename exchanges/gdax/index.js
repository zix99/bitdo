const gdax = require('gdax');
const Promise = require('bluebird');

module.exports = (config) => {
	const client = Promise.promisifyAll(new gdax.AuthenticatedClient(config.key, config.b64secret, config.passphrase));

	return {
		getCurrentPrice() {

		},
	};
};
