/*

	swr-lab-fallback

	AUTHOR		Daniel Freytag
			https://twitter.com/FRYTG
			https://github.com/FRYTG

*/

// set global vars
global.servicePort = 8080;
global.serviceStage = 'prod';
global.serviceName = 'audio-lab-fallback';
global.datastoreNamespace = 'radiohub';
global.datastoreRadiohubProject = 'swr-lab-radiohub';
global.cloudKey = './keys/swr-lab-radiohub.json';
process.env.TZ = 'utc';

// load node utils
const express = require('express');
const app = express();
const moment = require('moment');
moment.locale('de');

// load datastore (radiohub edition)
const { Datastore } = require('@google-cloud/datastore');
const datastoreRadiohub = new Datastore({
	projectId: global.datastoreRadiohubProject,
	namespace: global.datastoreNamespace,
	keyFilename: global.cloudKey,
});

// load utils
const headerMetaSet = require('./utils/headerMetaSet');

// This is a GKE healthcheck
app.get('/', function (req, res) {
	const startTime = moment().valueOf();

	res.status(200).json({
		status: 200,
		message: 'OK - hello world',
		data: null,
		info: {
			...headerMetaSet(req, res, startTime, null),
		},
		links: {
			blog: 'https://lab.swr.de/',
			docs: 'https://api.lab.swr.de/radiohub-docs/',
		},
	});
});

var options = {
	dotfiles: 'ignore',
	etag: false,
	index: false,
	maxAge: '7d',
	redirect: false,
	setHeaders: function (res) {
		res.set('x-timestamp', Date.now());
	},
};
app.use('/static', express.static('static', options));

app.get('/favicon.ico', function (req, res) {
	res.status(200).sendFile(__dirname + '/static/favicon.ico');
});

app.get('/robots.txt', function (req, res) {
	res.status(200).sendFile(__dirname + '/static/robots.txt');
});

// verify, that's is actually us
app.get('/google760978e858af9a74.html', function (req, res) {
	res.status(200).sendFile(__dirname + '/static/google760978e858af9a74.html');
});

app.get('/loaderio-6b0e4c063508c46fa87f887f702badef.txt', function (req, res) {
	res.status(200).sendFile(__dirname + '/static/loaderio-6b0e4c063508c46fa87f887f702badef.txt');
});

app.get('/loaderio-e669490a1a08023dc7b2b4c83588382f.txt', function (req, res) {
	res.status(200).sendFile(__dirname + '/static/loaderio-e669490a1a08023dc7b2b4c83588382f.txt');
});

// legacy urls to shut down narrative news service
app.get('/narrativenews/swr3news.xml', function (req, res) {
	res.redirect(
		'https://api.lab.swr.de/radiohub/v2/content/feed/single/rss/swr3-news?d=narrativenews-redirect'
	);
});

app.get('/narrativenews/swraktuell.xml', function (req, res) {
	res.redirect(
		'https://api.lab.swr.de/radiohub/v2/content/feed/single/rss/swraktuell-news?d=narrativenews-redirect'
	);
});

app.get('/narrativenews/static/swr3.jpg', function (req, res) {
	res.redirect('https://cdn-static.lab.swr.de/images/v1/get/SWR3-icon/img?width=1440&d=narrativenews-redirect');
});

// redirect to radiohub docs, since it no longer lives inside GKE
app.get('/radiohub-docs/', function (req, res) {
	res.redirect('https://swr-radiohub-docs-fvzgr4xolq-ew.a.run.app/');
});

app.get('/radiohub-docs/openapi.yaml', function (req, res) {
	res.redirect('https://github.com/swrlab/swr-radiohub-docs/blob/master/openapi.yaml');
});

app.get('/radiohub-docs/openapi.json', function (req, res) {
	res.redirect('https://github.com/swrlab/swr-radiohub-docs/blob/master/openapi.json');
});

app.get('/radiohub-docs/changelog', function (req, res) {
	res.redirect('https://github.com/swrlab/swr-radiohub-docs/blob/master/CHANGELOG.md');
});

// redirect service from DB
app.get('/re/:slug', async (req, res, next) => {
	try {
		// query datastore
		let key = datastoreRadiohub.key(['redirect', req.params.slug]);
		let [redirect] = await datastoreRadiohub.get(key);

		// return 404 if not found
		if (!redirect || !redirect.url) {
			return next();
		}

		// redirect user
		res.redirect(redirect.url);
	} catch (err) {
		// send err 500 to user
		res.status(500).json({
			status: 500,
			message: 'Server error',
			data: null,
			info: {
				...headerMetaSet(req, res, 0, null),
			},
			links: {
				docs: 'https://api.lab.swr.de/radiohub-docs/',
			},
		});
	}
});

// locally log 404
// collect logs to global log if needed or wanted (could get sampled)
app.use(function (req, res) {
	// start latency counter
	const startTime = moment().valueOf();

	// log error and request
	console.error(
		'lab.fallback',
		'404 error',
		JSON.stringify({
			query: req.query,
			path: req.path,
			headers: req.headers,
			hostname: req.hostname,
		})
	);

	// send err 404 to user
	res.status(404).json({
		status: 404,
		message: 'Not found',
		data: null,
		info: {
			...headerMetaSet(req, res, startTime, null),
		},
		links: {
			docs: 'https://api.lab.swr.de/radiohub-docs/',
		},
	});
});

// start express server
app.disable('x-powered-by');
app.listen(global.servicePort);

// quit if test (github action)
if (process.env.IS_TEST == 'true') {
	process.exit();
}
