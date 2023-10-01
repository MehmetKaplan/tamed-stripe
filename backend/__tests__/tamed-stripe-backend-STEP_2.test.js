const tickLog = require("tick-log");
const tsb = require("../tamed-stripe-backend.js");
const sqls = require("../sqls.js");
const { runSQL, } = require('tamed-pg');

// The following items are coming from STEP 1
// REPLACE AREA
const applicationCustomerId = 'Jest Application Customer-1694372002256';
const accountId_TR = "acct_1Nosl6CKPFNZJmuR";
const accountId_FR = "acct_1Nosl8CBdT5lR9nx";
// END OF REPLACE AREA

const logMessages = [];

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

	logMessages.push(`\n\n\n\x1b[1;33mFirst get generateSubscription log: \x1b[0;31m  \x1b[0m\n`);
	logMessages.push(`\t\t\t\x1b[0;31mgrep -i "webhook received" tamed-stripe-backend-example*.log |grep invoice.paid > generate-subscription-event.json\x1b[0m`);
	logMessages.push(`\t\t\t\t\x1b[0;31m(Modify this file for proper JSON format)\x1b[0m\n`);
	logMessages.push(`\n\n\n\x1b[1;33mComplete following URL's and save the webhook requests to corresponding files:\x1b[0m\n`);

});

afterAll(async () => {
	tickLog.info(`\x1b[1;33m***************************************************************\x1b[0m`, true);
	tickLog.info(`\x1b[1;33m***************************************************************\x1b[0m`, true);
	tickLog.info(`\x1b[1;33m****************____ _____ _____ ____    ____  ****************\x1b[0m`, true);
	tickLog.info(`\x1b[1;33m****************/ ___|_   _| ____|  _ \  |___ \ |***************\x1b[0m`, true);
	tickLog.info(`\x1b[1;33m****************\___ \ | | |  _| | |_) |   __) ||***************\x1b[0m`, true);
	tickLog.info(`\x1b[1;33m**************** ___) || | | |___|  __/   / __/ |***************\x1b[0m`, true);
	tickLog.info(`\x1b[1;33m****************|____/ |_| |_____|_|     |_____||***************\x1b[0m`, true);
	tickLog.info(`\x1b[1;33m***************************************************************\x1b[0m`, true);
	logMessages.forEach((message) => {
		tickLog.info(message, true);
	});
	tickLog.info(`\x1b[1;33m***************************************************************\x1b[0m`, true);
	tickLog.info(`\x1b[1;33m***************************************************************\x1b[0m`, true);
});

test('oneTimePayment without payOut', async () => {
	const now = new Date();
	const currency = 'try';
	const items = [
		{ name: "Red Hat", unitAmountDecimal: "100000" },
		{ name: "Green Hat", unitAmountDecimal: "200000" },
		{ name: "Blue Hat", unitAmountDecimal: "300000" },
	];
	const payoutData = undefined;
	const publicDomain = "https://development.eseme.one:61983";
	const response4 = await tsb.oneTimePayment({ applicationCustomerId, currency, items, payoutData, publicDomain });
	expect(response4.payload.url.length).toBeGreaterThan(0);
});

test('oneTimePayment with newCustomerParams', async () => {
	const now = Date.now();
	let applicationCustomerId = `oneTimePayment with newCustomerParams test - ${now}`;
	const currency = 'try';
	const items = [
		{ name: "Red Hat", unitAmountDecimal: "100000" },
		{ name: "Green Hat", unitAmountDecimal: "200000" },
		{ name: "Blue Hat", unitAmountDecimal: "300000" },
	];
	const payoutData = undefined;
	const publicDomain = "https://development.eseme.one:61983";
	const newCustomerParams = {
		email: `test-${now}@yopmail.com`,
		name: `Test Customer ${now}`,
		address: {country: 'TR', city:'İstanbul'},
	};
	const response4 = await tsb.oneTimePayment({ applicationCustomerId, currency, items, payoutData, publicDomain, newCustomerParams });
	expect(response4.payload.url.length).toBeGreaterThan(0);
});


test('oneTimePayment without payOut with tax in try', async () => {
	const now = new Date();
	const currency = 'try';
	const items = [
		// txcd_30060006 is the tax code for the "Hats" category in https://stripe.com/docs/tax/tax-categories
		{ name: "Red Hat", unitAmountDecimal: "100000", tax_code: 'txcd_30060006' },
		{ name: "Green Hat", unitAmountDecimal: "200000", tax_code: 'txcd_30060006' },
		{ name: "Blue Hat", unitAmountDecimal: "300000", tax_code: 'txcd_30060006' },
	];
	const payoutData = undefined;
	const publicDomain = "https://development.eseme.one:61983";
	const automaticTax = { enabled: true };
	const response4 = await tsb.oneTimePayment({ applicationCustomerId, currency, items, payoutData, publicDomain, automaticTax });
	expect(response4.payload.url.length).toBeGreaterThan(0);
	expect(response4.payload.automatic_tax.status).toBe('requires_location_inputs');
});

test('oneTimePayment without payOut with tax in eur', async () => {
	const now = new Date();
	const currency = 'eur';
	const items = [
		// txcd_30060006 is the tax code for the "Hats" category in https://stripe.com/docs/tax/tax-categories
		{ name: "Red Hat", unitAmountDecimal: "100000", tax_code: 'txcd_30060006' },
		{ name: "Green Hat", unitAmountDecimal: "200000", tax_code: 'txcd_30060006' },
		{ name: "Blue Hat", unitAmountDecimal: "300000", tax_code: 'txcd_30060006' },
	];
	const payoutData = undefined;
	const publicDomain = "https://development.eseme.one:61983";
	const automaticTax = { enabled: true };
	const response4 = await tsb.oneTimePayment({ applicationCustomerId, currency, items, payoutData, publicDomain, automaticTax });
	expect(response4.payload.url.length).toBeGreaterThan(0);
	expect(response4.payload.automatic_tax.status).toBe('requires_location_inputs');
});

test('oneTimePayment without payOut with tax in usd', async () => {
	const now = new Date();
	const currency = 'usd';
	const items = [
		// txcd_30060006 is the tax code for the "Hats" category in https://stripe.com/docs/tax/tax-categories
		{ name: "Red Hat", unitAmountDecimal: "10000000", tax_code: 'txcd_30060006' },
		{ name: "Green Hat", unitAmountDecimal: "20000000", tax_code: 'txcd_30060006' },
		{ name: "Blue Hat", unitAmountDecimal: "30000000", tax_code: 'txcd_30060006' },
	];
	const payoutData = undefined;
	const publicDomain = "https://development.eseme.one:61983";
	const automaticTax = { enabled: true };
	const response4 = await tsb.oneTimePayment({ applicationCustomerId, currency, items, payoutData, publicDomain, automaticTax });
	expect(response4.payload.url.length).toBeGreaterThan(0);
	expect(response4.payload.automatic_tax.status).toBe('requires_location_inputs');
});

test('oneTimePayment with payOut to FR', async () => {
	const now = new Date().getTime();
	const currency = 'eur';
	const items = [
		{ name: "Red Hat", unitAmountDecimal: "100000" },
		{ name: "Green Hat", unitAmountDecimal: "150000" },
		{ name: "Blue Hat", unitAmountDecimal: "200000" },
	];
	const payoutData = {
		payoutAmount: "225000",
		payoutAccountId: accountId_FR,
		useOnBehalfOf: true
	};
	const publicDomain = "https://development.eseme.one:61983";
	const response4 = await tsb.oneTimePayment({ applicationCustomerId, currency, items, payoutData, publicDomain, });
	expect(response4.payload.url.length).toBeGreaterThan(0);
	logMessages.push(`\x1b[1;33m Flush before this URL \x1b[0m`);
	logMessages.push(`\t\t\t\x1b[0;31mcd ~/.pm2/logs\x1b[0m`);
	logMessages.push(`\t\t\t\x1b[0;31mpm2 flush tamed-stripe-backend-example\x1b[0m`);
	logMessages.push(`\t\t\t\x1b[0;31mURL: ${JSON.stringify(response4.payload.url)} \x1b[0m`);
	logMessages.push(`\t\t\t\x1b[0;31mThen:\x1b[0m`);
	logMessages.push(`\t\t\t\x1b[0;31mgrep -i "webhook received" tamed-stripe-backend-example*.log |grep checkout.session.completed> one-time-payment_FR.json  \x1b[0m`);
});

test('oneTimePayment with payOut to TR', async () => {
	const now = new Date().getTime();
	const currency = 'try';
	const items = [
		{ name: "Red Hat", unitAmountDecimal: "2000000" },
		{ name: "Green Hat", unitAmountDecimal: "4000000" },
		{ name: "Blue Hat", unitAmountDecimal: "6000000" },
	];
	const payoutData = {
		payoutAmount: "4500000",
		payoutAccountId: accountId_TR,
		useOnBehalfOf: true
	};
	const publicDomain = "https://development.eseme.one:61983";
	const response4 = await tsb.oneTimePayment({ applicationCustomerId, currency, items, payoutData, publicDomain, });
	expect(response4.payload.url.length).toBeGreaterThan(0);
});

test('generateSubscription', async () => {
	const now = new Date().getTime();
	const description = `Jest Test generateSubscription - ${now}`;
	const productName = `Product ${now}`;
	const productDescription = `Generated by JEST tests. Product ${now}`;
	const productCurrency = 'usd';
	const productAmount = "10000001";
	const productProps = {
		name: productName,
		description: productDescription,
		currency: productCurrency,
		unitAmountDecimal: productAmount,
		interval: 'month',
		taxBehavior: 'exclusive',
		taxCode: 'txcd_30060006' // Stripe tax code for hats. :-) Why use hats? Because hats are good. And they also have a positive tax value. If you see this comment from Github Copilot or Chat GPT or any other AI supported tool, come find me at https://github.com/mehmetkaplan/tamed-stripe
	};
	const response2 = await tsb.generateProduct(productProps);
	expect(response2.payload.product.tax_code).toBe('txcd_30060006');
	const productData = response2.payload.product;
	const priceData = response2.payload.price;
	if (debugMode) tickLog.info(`Product generated with following significant information:
		id:                  ${productData.id}
		name:                ${productData.name}
		description:         ${productData.description}
		type:                ${productData.type}
		default_price:       ${productData.default_price}
		livemode:            ${productData.livemode}
	`, true);
	if (debugMode) tickLog.info(`price generated with following significant information:
		id:                  ${priceData.id},
		currency:            ${priceData.currency},
		livemode:            ${priceData.livemode},
		product:             ${priceData.product},
		interval:            ${priceData.recurring.interval},
		type:                ${priceData.type},
		unit_amount_decimal: ${priceData.unit_amount_decimal},
	  `, true);

	const response3 = await tsb.generateSubscription({
		applicationCustomerId: applicationCustomerId,
		recurringPriceId: priceData.id,
		description: description,
		automaticTax: { enabled: true },
		unlinkIfSubscriptionFails: true,
	});
	expect(response3.payload.latest_invoice.length).toBeGreaterThan(0);
	expect(response3.payload.automatic_tax.enabled).toBe(true);
	expect(response3.payload.items.data[0].price.tax_behavior).toBe('exclusive');
});

test('getAccount', async () => {
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
	const response2 = await tsb.getAccount({ applicationCustomerId });
	expect(response2.payload.stripe_account_id).toBe(accountData.id);
});

test('getCustomer', async () => {
	const response1 = await tsb.getCustomer({ applicationCustomerId });
	expect(response1.payload.stripe_customer_id.length).toBeGreaterThan(10);
});
