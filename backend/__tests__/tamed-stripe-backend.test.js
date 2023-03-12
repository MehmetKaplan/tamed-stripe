

const tickLog = require("tick-log");
const tsb = require("../tamed-stripe-backend.js");
const sqls = require("../sqls.js");
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

/*
test('generateCustomer', async () => {
	const now = new Date().getTime();
	const body = {
		applicationCustomerId: `Jest Application Customer-${now}`,
		description: `Jest Customer ${now}`,
		email: `test-${now}@yopmail.com`,
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
	let customerAtDB = await runSQL(poolName, sqls.selectCustomer, [customerData.id], debugMode);
	expect(customerAtDB.rows.length).toBe(1);
	expect(customerAtDB.rows[0].stripe_customer_id).toEqual(customerData.id);
	expect(customerAtDB.rows[0].customer_object).toEqual(customerData);
});

*/ 
test('generateAccount (connected account for payouts) in TR', async () => {
	const country = "TR";
	const now = Date.now();
	const applicationCustomerId = `Application Customer-${now}`;
	const email = `${now}@yopmail.com`;
	const publicDomain = "https://development.eseme.one:61983";
	const props = {
		applicationCustomerId: applicationCustomerId,
		email: email,
		publicDomain: publicDomain,
		country: country,
	};
	const response1 = await tsb.generateAccount(props);
	const accountData = response1.payload;
	tickLog.info(`Account generated with following significant information:\n   id:                  ${accountData.id}\n   type:                ${accountData.type}\n   capabilities:        ${JSON.stringify(accountData.capabilities)}\n   email:               ${accountData.email}\n   Payment Schedule:    ${JSON.stringify(accountData.settings.payouts.schedule)}\n   accountLinkURL:      ${accountData.accountLinkURL}`, true);
	expect(accountData.id).not.toBeNull();
	expect(accountData.type).toEqual('express');
	// jest compare object
	expect(accountData.capabilities).toEqual({ "transfers": "inactive" });
	expect(accountData.email).toEqual(email);
	expect(accountData.settings.payouts.schedule.interval).toEqual('daily');
	let accountAtDB = await runSQL(poolName, sqls.selectAccount, [applicationCustomerId], debugMode);
	expect(accountAtDB.rows.length).toBe(1);
	expect(accountAtDB.rows[0].stripe_account_id).toEqual(accountData.id);
	expect(accountAtDB.rows[0].account_object).toEqual(accountData);
});



test('generateAccount (connected account for payouts) in FR', async () => {
	const country = "FR";
	const now = Date.now();
	const applicationCustomerId = `Application Customer-${now}`;
	const email = `${now}@yopmail.com`;
	const publicDomain = "https://development.eseme.one:61983";
	const props = {
		applicationCustomerId: applicationCustomerId,
		email: email,
		publicDomain: publicDomain,
		country: country,
	};
	const response1 = await tsb.generateAccount(props);
	const accountData = response1.payload;
	tickLog.info(`Account generated with following significant information:\n   id:                  ${accountData.id}\n   type:                ${accountData.type}\n   capabilities:        ${JSON.stringify(accountData.capabilities)}\n   email:               ${accountData.email}\n   Payment Schedule:    ${JSON.stringify(accountData.settings.payouts.schedule)}\n   accountLinkURL:      ${accountData.accountLinkURL}`, true);
	expect(accountData.id).not.toBeNull();
	expect(accountData.type).toEqual('express');
	// jest compare object
	expect(accountData.capabilities).toEqual({ "transfers": "inactive" });
	expect(accountData.email).toEqual(email);
	expect(accountData.settings.payouts.schedule.interval).toEqual('daily');
	let accountAtDB = await runSQL(poolName, sqls.selectAccount, [applicationCustomerId], debugMode);
	expect(accountAtDB.rows.length).toBe(1);
	expect(accountAtDB.rows[0].stripe_account_id).toEqual(accountData.id);
	expect(accountAtDB.rows[0].account_object).toEqual(accountData);
});

test('generateAccount same account in state W twice', async () => {
	const country = undefined;
	const now = Date.now();
	const applicationCustomerId = `Application Customer-${now}`;
	const email = `${now}@yopmail.com`;
	const publicDomain = "https://development.eseme.one:61983";
	const props = {
		applicationCustomerId: applicationCustomerId,
		email: email,
		publicDomain: publicDomain,
		country: country,
	};
	const response1 = await tsb.generateAccount(props);
	const accountData1 = response1.payload;
	const response2 = await tsb.generateAccount(props);
	const accountData2 = response2.payload;

	expect(accountData1.id).toEqual(accountData2.id);
	expect(accountData1.accountLinkURL).not.toEqual(accountData2.accountLinkURL); // new account link should be generated
	expect(accountData1?.urlRegenerated).toBeFalsy();
	expect(accountData2.urlRegenerated).toBe(true);
});


/* 
test('oneTimePayment without payOut', async () => {
	const now = new Date();

	// payoutData: {payoutAmount, payoutAccountId, useOnBehalfOf: true|false}
	// items: [{name, unitAmountDecimal}]
	// const { customerId, currency, items, payoutData, successUrl, cancelUrl } = body;
	// This is a previously generated customer id and its credit card information 
	// 	is updated using the link from checkout session coming within the generateCustomer method.
	const customerId = 'cus_NVaVksq70fVlqI';
	const currency = 'try';
	const items = [
		{ name: "iPhone", unitAmountDecimal: "100000" },
		{ name: "iPad", unitAmountDecimal: "200000" },
		{ name: "iMac", unitAmountDecimal: "300000" },
	];
	const payoutData = undefined;
	const publicDomain = "https://development.eseme.one:61983";
	const successRoute = "/one-time-payment-success-route";
	const cancelRoute = "/one-time-payment-cancel-route";
	const response4 = await tsb.oneTimePayment({ customerId, currency, items, payoutData, publicDomain, successRoute, cancelRoute });
});

test('oneTimePayment with payOut to FR', async () => {
	const now = new Date();

	// payoutData: {payoutAmount, payoutAccountId, useOnBehalfOf: true|false}
	// items: [{name, unitAmountDecimal}]
	// const { customerId, currency, items, payoutData, successUrl, cancelUrl } = body;
	// This is a previously generated customer id and its credit card information 
	// 	is updated using the link from checkout session coming within the generateCustomer method.
	const customerId = 'cus_NVaVksq70fVlqI';
	// This is a previously generated account id
	const accountId = "acct_1MjkRw2HaPwigiek"; // 
	const currency = 'try';
	const items = [
		{ name: "iPhone", unitAmountDecimal: "100000" },
		{ name: "iPad", unitAmountDecimal: "200000" },
		{ name: "iMac", unitAmountDecimal: "300000" },
	];
	const payoutData = {
		payoutAmount: 450000,
		payoutAccountId: accountId,
		useOnBehalfOf: true
	};
	const publicDomain = "https://development.eseme.one:61983";
	const successRoute = "/one-time-payment-success-route";
	const cancelRoute = "/one-time-payment-cancel-route";
	const response4 = await tsb.oneTimePayment({ customerId, currency, items, payoutData, publicDomain, successRoute, cancelRoute });
});

test('oneTimePayment with payOut to TR', async () => {
	const now = new Date();

	// payoutData: {payoutAmount, payoutAccountId, useOnBehalfOf: true|false}
	// items: [{name, unitAmountDecimal}]
	// const { customerId, currency, items, payoutData, successUrl, cancelUrl } = body;
	// This is a previously generated customer id and its credit card information 
	// 	is updated using the link from checkout session coming within the generateCustomer method.
	const customerId = 'cus_NVaVksq70fVlqI';
	// This is a previously generated account id
	const accountId = "acct_1Mjivf2HrSbgvhw4"; // "message":"TR is not currently supported by Stripe."
	const currency = 'try';
	const items = [
		{ name: "iPhone", unitAmountDecimal: "100000" },
		{ name: "iPad", unitAmountDecimal: "200000" },
		{ name: "iMac", unitAmountDecimal: "300000" },
	];
	const payoutData = {
		payoutAmount: 4500,
		payoutAccountId: accountId,
		useOnBehalfOf: true
	};
	const publicDomain = "https://development.eseme.one:61983";
	const successRoute = "/one-time-payment-success-route";
	const cancelRoute = "/one-time-payment-cancel-route";
	const response4 = await tsb.oneTimePayment({ customerId, currency, items, payoutData, publicDomain, successRoute, cancelRoute });
});


test('Webhook Scenario 1: Customer registration & card payment method setup save', async () => {

	const now = new Date().getTime();
	const body = {
		applicationCustomerId: `Jest Application Customer-${now}`,
		description: `Jest Customer ${now}`,
		email: `test-${now}@yopmail.com`,
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
	let customerAtDB = await runSQL(poolName, sqls.selectCustomer, [customerData.id], debugMode);
	expect(customerAtDB.rows.length).toBe(1);
	expect(customerAtDB.rows[0].stripe_customer_id).toEqual(customerData.id);
	expect(customerAtDB.rows[0].customer_object).toEqual(customerData);

	let webhookResult = await tsb.webhook({
		type: "checkout.session.expired",
		data: {
			object: {
				id: checkoutSessionData.id,
				mode: "setup",
			},
		},
	});
	let customerAtDB2 = await runSQL(poolName, sqls.selectCustomer, [customerData.id], debugMode);
	expect(customerAtDB2.rows.length).toBe(1);
	expect(customerAtDB2.rows[0].stripe_customer_id).toEqual(customerData.id);
	expect(customerAtDB2.rows[0].state).toEqual('W');
	expect(customerAtDB2.rows[0].application_customer_id).toBeNull();
});
*/

// MANUAL TESTS
/*

test('cancelSubscription', async () => {
	// 1. run only for generateCustomer and copy customer id
	// 2. replace customerId in related test cases with the copied customer id
	// 3. open the url within the checkoutSessionData console log output to configure credit card for the customer using test card number 4242 4242 4242 4242

	const now = new Date().getTime();

	// This is a previously generated customer id and its credit card information 
	// 	is updated using the link from checkout session coming within the generateCustomer method.
	const customerId = 'cus_NVaVksq70fVlqI';

	const description = `Jest Test Subscription - ${now}`;

	const productName = `Product ${now}`;
	const productDescription = `Generated by JEST tests. Product ${now}`;
	const productCurrency = 'usd';
	const productAmount = "100001";
	const productProps = {
		name: productName,
		description: productDescription,
		currency: productCurrency,
		unitAmountDecimal: productAmount,
		interval: 'month',
	};
	const response2 = await tsb.generateProduct(productProps);
	const productData = response2.payload.product;
	const priceData = response2.payload.price;
	tickLog.info(`Product generated with following significant information:
		id:                  ${productData.id}
		name:                ${productData.name}
		description:         ${productData.description}
		type:                ${productData.type}
		default_price:       ${productData.default_price}
		livemode:            ${productData.livemode}
	`, true);
	tickLog.info(`price generated with following significant information:
		id:                  ${priceData.id},
		currency:            ${priceData.currency},
		livemode:            ${priceData.livemode},
		product:             ${priceData.product},
		interval:            ${priceData.recurring.interval},
		type:                ${priceData.type},
		unit_amount_decimal: ${priceData.unit_amount_decimal},
	  `, true);

	const response3 = await tsb.generateSubscription({
		customerId: customerId,
		recurringPriceId: priceData.id,
		description: description,
	});

	const subscriptionAtDB = await runSQL(poolName, sqls.selectSubscription, [response3.payload.id], debugMode);
	tickLog.info(`subscriptionAtDB.rows[0]: ${JSON.stringify(subscriptionAtDB.rows[0], null, 2)}`, true); // deleteme
	expect(subscriptionAtDB.rows.length).toBe(1);
	const response4 = await tsb.cancelSubscription({subscriptionId: response3.payload.id});
	const subscriptionAtDB2 = await runSQL(poolName, sqls.selectSubscription, [response3.payload.id], debugMode);
	expect(subscriptionAtDB2.rows.length).toBe(0);

});
/*

test('generateSubscription', async () => {
	// 1. run only for generateCustomer and copy customer id
	// 2. replace customerId in related test cases with the copied customer id
	// 3. open the url within the checkoutSessionData console log output to configure credit card for the customer using test card number 4242 4242 4242 4242

	const now = new Date().getTime();

	// This is a previously generated customer id and its credit card information 
	// 	is updated using the link from checkout session coming within the generateCustomer method.
	const customerId = 'cus_NVaVksq70fVlqI';

	const description = `Jest Test Subscription - ${now}`;

	const productName = `Product ${now}`;
	const productDescription = `Generated by JEST tests. Product ${now}`;
	const productCurrency = 'usd';
	const productAmount = "100001";
	const productProps = {
		name: productName,
		description: productDescription,
		currency: productCurrency,
		unitAmountDecimal: productAmount,
		interval: 'month',
	};
	const response2 = await tsb.generateProduct(productProps);
	const productData = response2.payload.product;
	const priceData = response2.payload.price;
	tickLog.info(`Product generated with following significant information:
		id:                  ${productData.id}
		name:                ${productData.name}
		description:         ${productData.description}
		type:                ${productData.type}
		default_price:       ${productData.default_price}
		livemode:            ${productData.livemode}
	`, true);
	tickLog.info(`price generated with following significant information:
		id:                  ${priceData.id},
		currency:            ${priceData.currency},
		livemode:            ${priceData.livemode},
		product:             ${priceData.product},
		interval:            ${priceData.recurring.interval},
		type:                ${priceData.type},
		unit_amount_decimal: ${priceData.unit_amount_decimal},
	  `, true);

	const response3 = await tsb.generateSubscription({
		customerId: customerId,
		recurringPriceId: priceData.id,
		description: description,
	});

});


test('payment_intent.succeeded (Subscription)', async () => {
	// 1. run only for generateCustomer and copy customer id
	// 2. replace customerId in related test cases with the copied customer id
	// 3. open the url within the checkoutSessionData console log output to configure credit card for the customer using test card number 4242 4242 4242 4242
	// 4. run generateSubscription test case so that a subscription is created and payment event succeeds
	// 5. get the webhook logs from server for the payment event and save it into the payment_intent.succeeded.json file
	// 6. run the test case for paymentIntentSucceeded
	const event = require('./payment_intent.succeeded.json');
	const previousSubscriptionPayments = await runSQL(poolName, sqls.selectSubscriptionPaymentsByStripeCustomerId, [event.data.object.customer], debugMode);
	const webhookResult = await tsb.webhook(event);
	const subscriptionPayments = await runSQL(poolName, sqls.selectSubscriptionPaymentsByStripeCustomerId, [event.data.object.customer], debugMode);
	expect(subscriptionPayments.rows.length).toBe(previousSubscriptionPayments.rows.length + 1);
});

*/

test('generateAccount same account in state A again', async () => {
	// 1. run one of the generateAccount tests 
	// 2. Manually activate the account by following the link
	// 3. use the same applicationCustomerId here (you can get from DB)
	//   		select id, application_customer_id from tamedstripe.connected_accounts where state = 'A';
	const country = undefined;
	const now = Date.now();
	const applicationCustomerId = `Application Customer-1678659989247`;
	const email = `${now}@yopmail.com`;
	const publicDomain = "https://development.eseme.one:61983";
	const props = {
		applicationCustomerId: applicationCustomerId,
		email: email,
		publicDomain: publicDomain,
		country: country,
	};
	const response = await tsb.generateAccount(props);
	const accountData = response.payload;
	expect(accountData.accountLinkURL.length).toBe(0);
	expect(accountData.id.length).toBeGreaterThan(0);
});
