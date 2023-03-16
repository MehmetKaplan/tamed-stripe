const tickLog = require("tick-log");
const tsb = require("../tamed-stripe-backend.js");
const sqls = require("../sqls.js");
const { runSQL, } = require('tamed-pg');

// The following items are coming from STEP 1
const customerId = 'cus_NXM3AR5EfpIS7C';

const logMessages = [];

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


test('webhook for generateSubscription from Step2', async () => {
	const event = require('./generate-subscription-event.json');
	const previousSubscriptionPayments = await runSQL(poolName, sqls.selectSubscriptionPaymentsByStripeCustomerId, [event.data.object.customer], debugMode);
	const webhookResult = await tsb.webhook(event);
	const subscriptionPayments = await runSQL(poolName, sqls.selectSubscriptionPaymentsByStripeCustomerId, [event.data.object.customer], debugMode);
	expect(subscriptionPayments.rows.length).toBe(previousSubscriptionPayments.rows.length + 1);
});

test('webhook for oneTimePayment with payOut to FR from step2', async () => {
	const event = require('./one-time-payment_FR.json');
	const checkoutSessionId = event.data.object.id;
	const previousOneTimePaymentRecord = await runSQL(poolName, sqls.selectOneTimePayment, [checkoutSessionId], debugMode);
	const webhookResult = await tsb.webhook(event);
	const oneTimePaymentRecord = await runSQL(poolName, sqls.selectOneTimePayment, [checkoutSessionId], debugMode);
	//  'P', invoice.id, invoice.hosted_invoice_url
	expect(oneTimePaymentRecord.rows[0].state).toBe('P');
	expect(oneTimePaymentRecord.rows[0].invoice_id.length).toBeGreaterThan(0);
	expect(oneTimePaymentRecord.rows[0].hosted_invoice_url.length).toBeGreaterThan(0);
})
// Independent tests

test('cancelSubscription', async () => {
	const now = new Date().getTime();
	const description = `Jest Test cancelSubscription - ${now}`;
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
	expect(subscriptionAtDB.rows.length).toBe(1);
	const response4 = await tsb.cancelSubscription({subscriptionId: response3.payload.id});
	const subscriptionAtDB2 = await runSQL(poolName, sqls.selectSubscription, [response3.payload.id], debugMode);
	expect(subscriptionAtDB2.rows.length).toBe(0);

});

test('generateAccount same account in state A again', async () => {
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
	const response2 = await tsb.generateAccount(props);
	const accountData2 = response2.payload;
	expect(accountData2.accountLinkURL.length).toBeGreaterThan(0);
	expect(accountData2.id.length).toBeGreaterThan(0);
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
	expect(customerAtDB2.rows[0].state).toEqual('U');
	expect(customerAtDB2.rows[0].application_customer_id).toBeNull();
});

