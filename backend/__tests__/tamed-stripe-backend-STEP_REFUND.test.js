const stripeSK = require('../config.js').secretKey;
const stripe = require('stripe')(stripeSK);

const tickLog = require("tick-log");
const tsb = require("../tamed-stripe-backend.js");
const sqls = require("../sqls.js");
const { runSQL, } = require('tamed-pg');

let poolName;
const debugMode = false;

beforeAll(async () => {
	await tsb.init({
		debugMode,
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

test('refund of a oneTimePayment with payOut to FR', async () => {

	// retrieve this ecample from tamedstripedb database
	// sql: 
	// 			select update_time, state, checkout_session_id from tamedstripe.one_time_payments where state = 'P' order by update_time asc limit 1;
	// 	and update the used checkoutSessionIdToRefund below sql: 
	// 			update tamedstripe.one_time_payments set checkout_session_id = 'USED IN JEST TESTS - ' || cast(now() as varchar), state = 'W' where checkout_session_id = 'MODIFYME'
	const checkoutSessionIdToRefund = "cs_test_b1XzJUWBujCxIfyBomj9jQPnnWqNWFsrB0WXnYk8x76YUXqAoCGXBrEQKV";
	let response;
	try {
		response = await tsb.refundOneTimePayment({ checkoutSessionId: checkoutSessionIdToRefund });
		if (debugMode) tickLog.success(`response: ${JSON.stringify(response, null, 2)}`);
	} catch (error) {
		// In order not to fail overall tests
		tickLog.info(`Please correct the \x1b[1;33mcheckoutSessionIdToRefund\x1b[0m parameter in the \x1b[1;33mtamed-stripe-backend-STEP_5.test.js\x1b[0m file to test the \x1b[1;33mrefund functionality\x1b[0m.`, true);
		tickLog.info(`Error: ${error}.`, true);
		return;
	}
	expect (response.result).toBe('OK');
	// expect id to start with "re"
	expect (response.payload.id).toMatch(/^re/);
	expect (response.payload.object).toBe('refund');
	expect (response.payload.status).toBe('succeeded');
});
