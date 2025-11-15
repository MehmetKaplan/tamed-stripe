const tickLog = require("tick-log");
const tsb = require("../tamed-stripe-backend.js");
const sqls = require("../sqls.js");
const { runSQL, } = require('tamed-pg');

let poolName;

const debugMode = false;

const logMessages = [];

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
	logMessages.push(`\n\n\n\x1b[1;33mFirst arrange the PM2 actions:\x1b[0m\n`);
	logMessages.push(`\t\t\t\x1b[0;31mcd ~/.pm2/logs\x1b[0m`);
	logMessages.push(`\t\t\t\x1b[0;31mpm2 flush tamed-stripe-backend-example\x1b[0m`);
	logMessages.push(`\n\n\n\x1b[1;33mThen complete below actions in URLs and then replace following customer and account id data in tamed-stripe-backend-STEP_\x1b[0;31m2\x1b[1;33m.test.js and tamed-stripe-backend-STEP_\x1b[0;31m3\x1b[1;33m.test.js files.\x1b[0m\n`);

});

afterAll(async () => {
	tickLog.info(`\x1b[1;33m*********************************************************************\x1b[0m`,true);
	tickLog.info(`\x1b[1;33m******************   ____ _____ _____ ____    _    ******************\x1b[0m`,true);
	tickLog.info(`\x1b[1;33m******************  / ___|_   _| ____|  _ \  / |   ******************\x1b[0m`,true);
	tickLog.info(`\x1b[1;33m******************  \___ \ | | |  _| | |_) | | |   ******************\x1b[0m`,true);
	tickLog.info(`\x1b[1;33m******************   ___) || | | |___|  __/  | |   ******************\x1b[0m`,true);
	tickLog.info(`\x1b[1;33m******************  |____/ |_| |_____|_|     |_|   ******************\x1b[0m`,true);
	tickLog.info(`\x1b[1;33m*********************************************************************\x1b[0m`,true);
	logMessages.forEach((message) => {
		tickLog.info(message, true);
	});
	tickLog.info(`\x1b[1;33m***************************************************************\x1b[0m`,true);
	tickLog.info(`\x1b[0;31m***************************************************************\x1b[0m`,true);
});

test('generateCustomer', async () => {
	const now = new Date().getTime();
	const applicationCustomerId = `Jest Application Customer-${now}`;
	const body = {
		applicationCustomerId: applicationCustomerId,
		description: `Jest Customer ${now}`,
		email: `test-${now}@yopmail.com`,
		metadata: { "test": "test" },
		name: `Jest Customer ${now}`,
		phone: `1234567890`,
		address: { "line1": "77 Massachusetts Avenue", "city": "Cambridge", "state": "MA", "postal_code": "02139", "country": 'US' },
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
	let customerAtDB = await runSQL(poolName, sqls.selectCustomer, [customerData.id], debugMode);
	expect(customerAtDB.rows.length).toBe(1);
	expect(customerAtDB.rows[0].stripe_customer_id).toEqual(customerData.id);
	expect(customerAtDB.rows[0].customer_object).toEqual(customerData);
	logMessages.push(`\t\t\x1b[1;33mCustomer payment URL\x1b[0m: \x1b[0;31m${checkoutSessionData.url}\x1b[0m`);
	logMessages.push(`\t\t\x1b[1;33mcustomerID (no need to replace)\x1b[0m: \x1b[0;31m${customerData.id}\x1b[0m`);
	logMessages.push(`\t\t\x1b[1;33mapplicationCustomerId (3 places)\x1b[0m: \x1b[0;31m${applicationCustomerId}\x1b[0m`);
});

test('generateCustomer with same applicationCustomerId', async () => {
	const now = new Date().getTime();
	const applicationCustomerId = `Jest Application Customer-${now}`;
	const body = {
		applicationCustomerId: applicationCustomerId,
		description: `Jest Customer ${now}`,
		email: `test-${now}@yopmail.com`,
		metadata: { "test": "test" },
		name: `Jest Customer ${now}`,
		phone: `1234567890`,
		address: { "line1": "4515 15th Ave S", "city": "Seattle", "state": "WA", "postal_code": "98108" },
		publicDomain: "https://development.eseme.one:61983",
		successRoute: "/generate-customer-success-route",
		cancelRoute: "/generate-customer-cancel-route",
	};
	const resultDummy = await tsb.generateCustomer(body);
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
	let customerAtDB = await runSQL(poolName, sqls.selectCustomer, [customerData.id], debugMode);
	expect(customerAtDB.rows.length).toBe(1);
	expect(customerAtDB.rows[0].stripe_customer_id).toEqual(customerData.id);
	expect(customerAtDB.rows[0].customer_object).toEqual(customerData);
});

test('generateAccount (connected account for payouts) in TR', async () => {
	const country = "TR";
	const now = Date.now();
	const applicationCustomerIdTR = `Application Customer-${now}`;
	const email = `${now}@yopmail.com`;
	const publicDomain = "https://development.eseme.one:61983";
	const props = {
		applicationCustomerId: applicationCustomerIdTR,
		email: email,
		publicDomain: publicDomain,
		country: country,
	};
	const response1 = await tsb.generateAccount(props);
	const accountData = response1.payload;
	if (debugMode) tickLog.info(`Account generated with following significant information:\n   id:                  ${accountData.id}\n   type:                ${accountData.type}\n   capabilities:        ${JSON.stringify(accountData.capabilities)}\n   email:               ${accountData.email}\n   Payment Schedule:    ${JSON.stringify(accountData.settings.payouts.schedule)}\n   accountLinkURL:      ${accountData.accountLinkURL}`, true);
	expect(accountData.id).not.toBeNull();
	expect(accountData.type).toEqual('express');
	// jest compare object
	expect(accountData.capabilities).toEqual({ "transfers": "inactive" });
	expect(accountData.email).toEqual(email);
	expect(accountData.settings.payouts.schedule.interval).toEqual('daily');
	let accountAtDB = await runSQL(poolName, sqls.selectAccount, [applicationCustomerIdTR], debugMode);
	expect(accountAtDB.rows.length).toBe(1);
	expect(accountAtDB.rows[0].stripe_account_id).toEqual(accountData.id);
	expect(accountAtDB.rows[0].account_object).toEqual(accountData);
	logMessages.push(`\t\t\x1b[1;33mAccount URL\x1b[0m: \x1b[0;31m${accountData.accountLinkURL}\x1b[0m`);
	logMessages.push(`\t\t\x1b[1;33maccountId_TR (2 replaces in Step 2 and Step 1 files, 1 each)\x1b[0m: \x1b[0;31m${accountData.id}\x1b[0m`);
	logMessages.push(`\t\t\x1b[1;33mapplicationCustomerId_TR (no need to replace)\x1b[0m: \x1b[0;31m${applicationCustomerIdTR}\x1b[0m`);
});

test('generateAccount (connected account for payouts) in FR', async () => {
	const country = "FR";
	const now = Date.now();
	const applicationCustomerIdFR = `Application Customer-${now}`;
	const email = `${now}@yopmail.com`;
	const publicDomain = "https://development.eseme.one:61983";
	const props = {
		applicationCustomerId: applicationCustomerIdFR,
		email: email,
		publicDomain: publicDomain,
		country: country,
	};
	const response1 = await tsb.generateAccount(props);
	const accountData = response1.payload;
	if (debugMode) tickLog.info(`Account generated with following significant information:\n   id:                  ${accountData.id}\n   type:                ${accountData.type}\n   capabilities:        ${JSON.stringify(accountData.capabilities)}\n   email:               ${accountData.email}\n   Payment Schedule:    ${JSON.stringify(accountData.settings.payouts.schedule)}\n   accountLinkURL:      ${accountData.accountLinkURL}`, true);
	expect(accountData.id).not.toBeNull();
	expect(accountData.type).toEqual('express');
	// jest compare object
	expect(accountData.capabilities).toEqual({ "transfers": "inactive" });
	expect(accountData.email).toEqual(email);
	expect(accountData.settings.payouts.schedule.interval).toEqual('daily');
	let accountAtDB = await runSQL(poolName, sqls.selectAccount, [applicationCustomerIdFR], debugMode);
	expect(accountAtDB.rows.length).toBe(1);
	expect(accountAtDB.rows[0].stripe_account_id).toEqual(accountData.id);
	expect(accountAtDB.rows[0].account_object).toEqual(accountData);
	logMessages.push(`\t\t\x1b[1;33mAccount URL\x1b[0m: \x1b[0;31m${accountData.accountLinkURL}\x1b[0m`);
	logMessages.push(`\t\t\x1b[1;33maccountId_FR (1 replace)\x1b[0m: \x1b[0;31m${accountData.id}\x1b[0m`);
	logMessages.push(`\t\t\x1b[1;33mapplicationCustomerId_FR (no need to replace)\x1b[0m: \x1b[0;31m${applicationCustomerIdFR}\x1b[0m`);
});

