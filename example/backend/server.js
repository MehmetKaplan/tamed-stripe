const path = require('path');

const tes = require('tamed-express-server');
const {httpsKeys, port} = require('./server-parameters.js');

const startServer = async () => {
	let whitelist = undefined; // = ['normalRoute'];
	let testWhitelist = undefined; // = ['testRoute'];
	let fileFullPath = path.join(__dirname, 'handlers-from-library.js');
	tes.expressServer(httpsKeys, port, fileFullPath, whitelist, testWhitelist);
}

startServer();
