// server-parameters.js
module.exports = {
	pgKeys: {
		user: 'tamedstripeapp',
		password: 'tamedstripeapp.', // coming from database-setup/step00001.sql
		database: 'tamedstripedb',
		host: 'localhost',
		port: 5432,
	},
	httpsKeys: {
		keyPath: process.env.TLS_KEYPATH, // modify this if https is to be used
		certPath: process.env.TLS_CERTPATH, // modify this if https is to be used
	},
	port: process.env.TAMED_STRIPE_PORT || 3000
}
