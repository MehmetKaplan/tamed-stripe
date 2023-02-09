const tickLog = require("tick-log");
const tsb = require("../tamed-stripe-backend.js");

beforeAll(async () => {
	await tsb.init({
		debugMode: true,
		pgKeys: {
			user: 'serialentrepreneurapp',
			password: 'serialentrepreneurapp.', // coming from database-setup/step00001.sql
			database: 'serialentdb',
			host: 'localhost',
			port: 5432,
		},
	});
});

test('generateAccount payoutAccount true', async () => {
	let now = Date.now();
	let name = `${now}`;
	let middlename = `${now}`;
	let lastname = `${now}`;
	let email = `${now}@yopmail.com`;
	let password = `${now}`;
	let birthdate = `12.23.1912`; // Format is DD.MM.YYYY
	let gender = `${now % 2 === 0 ? 'female' : 'male'}`;
	const props = {
		email: email,
		name: name,
		middlename: middlename,
		lastname: lastname,
		password: password,
		birthdate: birthdate,
		gender: gender,
		payoutAccount: true,
	};
	try {
		let response1 = await tsb.generateAccount(props);
		let accountData = response1.payload;
		tickLog.info(`Customer generated with following significant information:\n   id:                  ${accountData.id}\n   capabilities:        ${JSON.stringify(accountData.capabilities)}\n   email:               ${accountData.email}\n   Payment Schedule:    ${JSON.stringify(accountData.settings.payouts.schedule)}`, true);
	} catch (error) {
	expect(true).toEqual(false);
	}
});
