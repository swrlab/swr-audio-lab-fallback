/*

	swr-lab-fallback

	AUTHOR		Daniel Freytag
			https://twitter.com/FRYTG
			https://github.com/FRYTG

*/


// load node utils
const os 				= require('os')
const moment				= require('moment')
	moment.locale('de')


module.exports = function(req, res, startTime, dataSource) { try {
	
	var requestLatency = startTime == 0 
			? 0 
			: parseInt(moment().valueOf() - startTime)

	var service = global.serviceName + ';' +
			global.serviceStage + ';' +
			dataSource + ';' +
			os.hostname() + ';' +
			requestLatency

	res.set('Cache-Control', 'no-cache, no-store, must-revalidate')
	res.set('swr-service', service)

	return {
		trace: req.headers['x-cloud-trace-context']
				? req.headers['x-cloud-trace-context']
				: null,
		service,
	}

} catch (err) {

	console.error('headerMetaSet', JSON.stringify({err}))
	return

} }
