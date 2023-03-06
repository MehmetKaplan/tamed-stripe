const tickLog = require("tick-log");
const tsb = require("../tamed-stripe-backend.js");
const sqls = require("../sqls.json");
const { runSQL, } = require('tamed-pg');

let poolName;
let debugMode = true; // true 

beforeAll(async () => {
	await tsb.init({
		debugMode: debugMode,
		// coming from database-setup
		pgKeys: {
			user: 'tamedstripeapp',
			password: 'tamedstripeapp.',
			database: 'tamedstripedb',
			host: 'localhost',
			port: 5432,
		},
	});
	poolName = tsb.exportedForTesting.poolInfoForTests.poolName;

});

//  description, email, metadata, name, phone, address, publicDomain, successRoute, cancelRoute
test('generateCustomer', async () => {
	const now = new Date();
	const body = {
		description: `Jest Customer ${now}`,
		email: `test-${now.getTime()}@yopmail.com`,
		metadata: { "test": "test" },
		name: `Jest Customer ${now}`,
		phone: `1234567890`,
		address: { "line1": "1234 Main St", "city": "San Francisco", "state": "CA", "postal_code": "94111" },
		publicDomain: "https://development.eseme.one:61983",
		successRoute: "/generate-customer-success-route",
		cancelRoute: "/generate-customer-cancel-route",
	};
	const result1 = await tsb.generateCustomer(body);
	const customerData = result1.payload.customer;
	const checkoutSessionData = result1.payload.checkoutSession;
	expect(customerData.id).toBeTruthy();
	expect(checkoutSessionData).toBeTruthy();
	expect(checkoutSessionData.id).toBeTruthy();
	expect(checkoutSessionData.customer).toBeTruthy();
	expect(checkoutSessionData.customer).toBe(customerData.id);
	expect(checkoutSessionData.success_url).toBeTruthy();
	expect(checkoutSessionData.cancel_url).toBeTruthy();
	expect(checkoutSessionData.success_url).toBe(`${body.publicDomain}${body.successRoute}?session_id={CHECKOUT_SESSION_ID}`);
	expect(checkoutSessionData.cancel_url).toBe(`${body.publicDomain}${body.cancelRoute}?session_id={CHECKOUT_SESSION_ID}`);
	if (debugMode) tickLog.success(`generateCustomer result: ${JSON.stringify(customerData, null, 2)}`, true);
	if (debugMode) tickLog.success(`checkoutSessionData result: ${JSON.stringify(checkoutSessionData, null, 2)}`, true);
});

