const Promise = require('bluebird');
const axios = require('axios');
const crypto = require('crypto');
const _ = require('lodash')
const config = require('./config');

function createSignedHeadersAsync(epoch, method, uri, serializedBody) {
	return new Promise((resolve, reject) => {
		const hmac = crypto.createHmac('sha256', new Buffer(config.b64secret, 'base64'));
		hmac.on('readable', () => {
			const data = hmac.read();
			if (data) {
				resolve({
					'CB-ACCESS-KEY' : config.key,
					'CB-ACCESS-SIGN' : data.toString('base64'),
					'CB-ACCESS-TIMESTAMP' : epoch,
					'CB-ACCESS-PASSPHRASE' : config.passphrase,
				})
			} else {
				reject(new Error('Error creating signature headers'));
			}
		});
		hmac.write('' + epoch);
		hmac.write(method.toUpperCase());
		hmac.write(uri);
		if (serializedBody)
			hmac.write(serializedBody);
		hmac.end();
	});
}

function executeRequest(method, uri, body) {
	const serializedBody = body ? JSON.stringify(body) : undefined;
	const epoch = ~~(new Date() / 1000);

	return createSignedHeadersAsync(epoch, method, uri, serializedBody)
		.then(headers => {
			return axios({
				method,
				url: `${config.host}${uri}`,
				data: serializedBody,
				headers,
			});
		}).then(resp => resp.data);
}

module.exports = {
	getOrders() {
		return executeRequest('GET', '/orders?status=all');
	},
};

module.exports.getOrders()
	.tap(console.log);