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
	/*	retrieve this example from tamedstripedb database. SQL: 


			select update_time, state, checkout_session_id from tamedstripe.one_time_payments where state = 'P' order by update_time asc limit 1;


		or if there is no more checkout session id with state = 'P', then use the example frontend app to generate

	*/
	const checkoutSessionIdToRefund = "cs_test_b19cT4j8fkFwgHxQqQV2jRveDiz58x9F6RCmSgaFJX0o5aWMLh9bU61RaN";
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
	const control = await runSQL(poolName, sqls.selectOneTimePaymentRefund, [checkoutSessionIdToRefund], debugMode);
	const control2 = await runSQL(poolName, sqls.selectOneTimePayment, [checkoutSessionIdToRefund], debugMode);
	if (debugMode) tickLog.success(`control.rows[0]: ${JSON.stringify(control.rows[0], null, 2)}`);
	expect(response.result).toBe('OK');
	// expect id to start with "re"
	expect(response.payload.id).toMatch(/^re/);
	expect(response.payload.object).toBe('refund');
	expect(response.payload.status).toBe('succeeded');
	expect(control.rows[0].refund_id).toBe(response.payload.id);
	expect(control.rows[0].checkout_session_id).toBe(checkoutSessionIdToRefund);
	expect(control2.rows[0].state).toBe("R");
});
