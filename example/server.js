const path = require('path');

const tes = require('tamed-express-server');

tes.init({
	debugMode: true,
	pgKeys: {
		user: 'serialentrepreneurapp',
		password: 'serialentrepreneurapp.', // coming from database-setup/step00001.sql
		database: 'serialentdb',
		host: 'localhost',
		port: 5432,
	},
});

const startServer = async () => {
	let whitelist = undefined; // = ['normalRoute'];
	let testWhitelist = undefined; // = ['testRoute'];
	let fileFullPath = path.join(__dirname, 'handlers-from-library.js');
	tes.expressServer(undefined, 3000, fileFullPath, whitelist, testWhitelist);
}

startServer();
