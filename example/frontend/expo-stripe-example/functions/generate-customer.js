const fetchLean = require('fetch-lean');
const { apiBackend, routes } = require('../config.js');

const generateCustomer = (props) => new Promise(async (resolve, reject) => {
	try {
		let body = {};
		body.description = props.description;
		body.email = props.email;
		body.metadata = props.metadata;
		body.name = props.name;
		body.phone = props.phone;
		body.address = props.address;

	
		let uri = `${apiBackend}${routes.generateCustomer}`;

		console.log(`\x1b[1;33m;Request: ${uri}\x1b[0m`);
		console.log(`\x1b[1;33m;Request: ${JSON.stringify(body)}\x1b[0m`);

		const response = await fetchLean('POST', uri, {}, body);
		console.log(`\x1b[0;32mResponse: ${JSON.stringify(response)}\x1b[0m`);
		return resolve({
			result: 'OK',
			payload: response,
		});
	} catch (error) {
		return reject(error);
	}
});


export default generateCustomer;