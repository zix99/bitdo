const Promise = require('bluebird');
const _ = require('lodash');

// Metrics can either return a number, or a promise

function loadMetricByName(metricData) {
	if (_.isPlainObject(metricData))
		return require(`./${metricData.metric}`);
	if (_.isString(metricData))
		return require(`./${metricData}`);
	return null;
}

module.exports = {
	evaluateMetric(metricData, market, context) {
		const metric = loadMetricByName(metricData);
		if (!metric)
			throw Error('Unable to load metric');

		return Promise.resolve(metric.call(metricData, market, context));
	}
};
