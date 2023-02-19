const backend = require('tamed-stripe-backend');
const {pgKeys} = require('./server-parameters.js');
backend.init({
	debugMode: true,
	pgKeys: pgKeys,
});
module.exports = backend;