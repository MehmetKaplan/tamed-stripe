const path = require('path');

const tes = require('tamed-express-server');

const serverParameters = require('./server-parameters.js');

tes.init({
	debugMode: true,
	pgKeys: serverParameters.pgKeys,
});

const startServer = async () => {
	let whitelist = undefined; // = ['normalRoute'];
	let testWhitelist = undefined; // = ['testRoute'];
	let fileFullPath = path.join(__dirname, 'handlers-from-library.js');
	tes.expressServer(serverParameters.httpsKeys, serverParameters.port, fileFullPath, whitelist, testWhitelist);
}

startServer();
