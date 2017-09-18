const Promise = require('bluebird');
const _ = require('lodash');

// Metrics can either return a number, or a promise

/*
Executes a metric, binding 'this' to the metric itself.

The 'metric' can either be a string (a metric with no config), or an object like:
{
	metric: 'name-of-metric',
	anyotherconfig: 123,
	...
}

The metric will be passed the market (which will contain the exchange) and the full application
context for any analysis it needs to do.

A promise or a value can be returned.  It is expected a number of the resulting metric is returned.

*/

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
