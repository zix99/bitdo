

module.exports = {
	exchange: {
		name: 'gdax',
		config: {

		}
	},
	period: '10m',
	rules: [
		{
			name: 'some buy',
			action: 'buy-limit',
			price: 100,
		},
		{
			name: 'spike surge',
			action: 'buy-stop-limit',
			stop: '5%',
			limit: '6%',
		},
		{
			name: 'safety stop',
			action: 'sell-stop-limit',
			stop: '-5%',
			limit: '-10%',
		},
	]
}
