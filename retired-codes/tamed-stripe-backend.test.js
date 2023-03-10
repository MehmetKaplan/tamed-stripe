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


test('generateProduct recurring', async () => {
	const now = Date.now();
	const name = `Recurring Product ${now}`;
	const description = `Generated by JEST tests. Recurring Product ${now}`;
	const currency = 'usd';
	const unitAmountDecimal = "100001";
	const interval = 'month';
	const props = {
		name,
		description,
		currency,
		unitAmountDecimal,
		interval
	};
	let response = await tsb.generateProduct(props);
	let productData = response.payload.product;
	let priceData = response.payload.price;
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
	expect(productData).toHaveProperty('id');
	expect(productData).toHaveProperty('name');
	expect(productData).toHaveProperty('description');
	expect(productData).toHaveProperty('type');
	expect(productData).toHaveProperty('default_price');
	expect(productData).toHaveProperty('livemode');
	expect(productData.name).toEqual(name);
	expect(productData.description).toEqual(description);
	expect(productData.type).toEqual('service');
	expect(productData.livemode).toEqual(false);
	expect(priceData).toHaveProperty('id');
	expect(priceData).toHaveProperty('currency');
	expect(priceData).toHaveProperty('livemode');
	expect(priceData).toHaveProperty('product');
	expect(priceData).toHaveProperty('recurring');
	expect(priceData).toHaveProperty('type');
	expect(priceData).toHaveProperty('unit_amount_decimal');
	expect(priceData.currency).toEqual(currency);
	expect(priceData.livemode).toEqual(false);
	expect(priceData.product).toEqual(productData.id);
	expect(priceData.recurring.interval).toEqual(interval);
	expect(priceData.type).toEqual('recurring');
	expect(priceData.unit_amount_decimal).toEqual(unitAmountDecimal);
	let productAtDB = await runSQL(poolName, sqls.selectProduct, [productData.id], debugMode);
	expect(productAtDB.rows.length).toBe(1);
	expect(productAtDB.rows[0].stripe_product_id).toEqual(productData.id);
	expect(productAtDB.rows[0].product_object).toEqual(productData);
	expect(productAtDB.rows[0].name).toEqual(name);
	expect(productAtDB.rows[0].description).toEqual(description);
	expect(productAtDB.rows[0].currency).toEqual(currency);
	expect(productAtDB.rows[0].interval).toEqual(interval);
	expect(productAtDB.rows[0].unit_amount_decimal).toEqual(`${unitAmountDecimal}`);
});

test('generateProduct NOT recurring', async () => {
	const now = Date.now();
	const name = `One Time Product ${now}`;
	const description = `Generated by JEST tests. One Time Product ${now}`;
	const currency = 'usd';
	const unitAmountDecimal = "100001";
	const props = {
		name,
		description,
		currency,
		unitAmountDecimal,
	};
	let response = await tsb.generateProduct(props);
	let productData = response.payload.product;
	let priceData = response.payload.price;
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
		interval:            ${priceData.interval},
		type:                ${priceData.type},
		unit_amount_decimal: ${priceData.unit_amount_decimal},
	  `, true);
	expect(productData).toHaveProperty('id');
	expect(productData).toHaveProperty('name');
	expect(productData).toHaveProperty('description');
	expect(productData).toHaveProperty('type');
	expect(productData).toHaveProperty('default_price');
	expect(productData).toHaveProperty('livemode');
	expect(productData.name).toEqual(name);
	expect(productData.description).toEqual(description);
	expect(productData.type).toEqual('service');
	expect(productData.livemode).toEqual(false);
	expect(priceData).toHaveProperty('id');
	expect(priceData).toHaveProperty('currency');
	expect(priceData).toHaveProperty('livemode');
	expect(priceData).toHaveProperty('product');
	expect(priceData).toHaveProperty('recurring');
	expect(priceData).toHaveProperty('type');
	expect(priceData).toHaveProperty('unit_amount_decimal');
	expect(priceData.currency).toEqual(currency);
	expect(priceData.livemode).toEqual(false);
	expect(priceData.product).toEqual(productData.id);
	expect(priceData.recurring).toBeFalsy();
	expect(priceData.type).toEqual('one_time');
	expect(priceData.unit_amount_decimal).toEqual(unitAmountDecimal);
	let productAtDB = await runSQL(poolName, sqls.selectProduct, [productData.id], debugMode);
	expect(productAtDB.rows.length).toBe(1);
	expect(productAtDB.rows[0].stripe_product_id).toEqual(productData.id);
	expect(productAtDB.rows[0].product_object).toEqual(productData);
	expect(productAtDB.rows[0].name).toEqual(name);
	expect(productAtDB.rows[0].description).toEqual(description);
	expect(productAtDB.rows[0].currency).toEqual(currency);
	expect(productAtDB.rows[0].interval).toEqual("");
	expect(productAtDB.rows[0].unit_amount_decimal).toEqual(`${unitAmountDecimal}`);
});

test('generateCustomer', async () => {
	let now = Date.now();
	let email = `${now}@yopmail.com`;
	let description = `Generated by JEST tests. Customer ${now}`;
	let metadata = {
		"testField": "testValue1",
		"testField2": "testValue2"
	};
	let name = `Customer ${now}`;
	let phone = `+1 555 555 5555`;
	let address =
	{
		city: "San Francisco",
		country: "US",
		line1: "1234 Main Street",
		line2: "Apt. 4",
		postal_code: "94111",
		state: "CA"
	}
	const props = {
		description, email, metadata, name, phone, address
	};
	let response1 = await tsb.generateCustomer(props);
	let customerData = response1.payload;
	tickLog.info(`Customer generated with following significant information:\n   id:                  ${customerData.id}\n   object:              ${JSON.stringify(customerData.object)}\n   email:               ${customerData.email}\n   metadata:            ${JSON.stringify(customerData.metadata)}\n   name:                ${customerData.name}\n   phone:               ${customerData.phone}\n   address:             ${JSON.stringify(customerData.address)}\n   livemode:            ${customerData.livemode}`, true);
	expect(customerData).toHaveProperty('id');
	expect(customerData).toHaveProperty('object');
	expect(customerData).toHaveProperty('description');
	expect(customerData).toHaveProperty('email');
	expect(customerData).toHaveProperty('livemode');
	expect(customerData).toHaveProperty('metadata');
	expect(customerData).toHaveProperty('name');
	expect(customerData).toHaveProperty('phone');
	expect(customerData).toHaveProperty('address');
	expect(customerData.email).toEqual(email);
	let customerAtDB = await runSQL(poolName, sqls.selectCustomer, [customerData.id], debugMode);
	expect(customerAtDB.rows.length).toBe(1);
	expect(customerAtDB.rows[0].stripe_customer_id).toEqual(customerData.id);
	expect(customerAtDB.rows[0].customer_object).toEqual(customerData);
});

test('generateCustomer with same email twice', async () => {
	let now = Date.now();
	let email = `${now}@yopmail.com`;
	let description = `Generated by JEST tests. Customer ${now}`;
	let metadata = {
		"testField": "testValue1",
		"testField2": "testValue2"
	};
	let name = `Customer ${now}`;
	let phone = `+1 555 555 5555`;
	let address =
	{
		city: "San Francisco",
		country: "US",
		line1: "1234 Main Street",
		line2: "Apt. 4",
		postal_code: "94111",
		state: "CA"
	}
	const props = {
		description, email, metadata, name, phone, address
	};
	let response1 = await tsb.generateCustomer(props);
	let customerData = response1.payload;
	tickLog.info(`Customer generated with following significant information:\n   id:                  ${customerData.id}\n   object:              ${JSON.stringify(customerData.object)}\n   email:               ${customerData.email}\n   metadata:            ${JSON.stringify(customerData.metadata)}\n   name:                ${customerData.name}\n   phone:               ${customerData.phone}\n   address:             ${JSON.stringify(customerData.address)}\n   livemode:            ${customerData.livemode}`, true);
	expect(customerData).toHaveProperty('id');
	expect(customerData).toHaveProperty('object');
	expect(customerData).toHaveProperty('description');
	expect(customerData).toHaveProperty('email');
	expect(customerData).toHaveProperty('livemode');
	expect(customerData).toHaveProperty('metadata');
	expect(customerData).toHaveProperty('name');
	expect(customerData).toHaveProperty('phone');
	expect(customerData).toHaveProperty('address');
	expect(customerData.email).toEqual(email);
	let customerAtDB = await runSQL(poolName, sqls.selectCustomer, [customerData.id], debugMode);
	expect(customerAtDB.rows.length).toBe(1);
	expect(customerAtDB.rows[0].stripe_customer_id).toEqual(customerData.id);
	expect(customerAtDB.rows[0].customer_object).toEqual(customerData);
	let response2 = await tsb.generateCustomer(props);
	let customerData2 = response2.payload;
	tickLog.info(`customerData2: ${JSON.stringify(customerData2)}`, true);
	expect(customerData2.id).not.toEqual(customerData.id);
});

test('generateAccount (connected account for payouts)', async () => {
	let publicDomain = "http://localhost:3000";
	let refreshUrlRoute = "/account-authorize";
	let returnUrlRoute = "/account-generated";

	let now = Date.now();
	let email = `${now}@yopmail.com`;
	const props = {
		email: email,
		publicDomain: publicDomain,
		refreshUrlRoute: refreshUrlRoute,
		returnUrlRoute: returnUrlRoute,
	};
	let response1 = await tsb.generateAccount(props);
	let accountData = response1.payload;
	tickLog.info(`Account generated with following significant information:\n   id:                  ${accountData.id}\n   type:                ${accountData.type}\n   capabilities:        ${JSON.stringify(accountData.capabilities)}\n   email:               ${accountData.email}\n   Payment Schedule:    ${JSON.stringify(accountData.settings.payouts.schedule)}\n   accountLinkURL:      ${accountData.accountLinkURL}`, true);
	expect(accountData.id).not.toBeNull();
	expect(accountData.type).toEqual('express');
	// jest compare object
	expect(accountData.capabilities).toEqual({ "transfers": "inactive" });
	expect(accountData.email).toEqual(email);
	expect(accountData.settings.payouts.schedule.interval).toEqual('daily');
	let accountAtDB = await runSQL(poolName, sqls.selectAccount, [accountData.id], debugMode);
	expect(accountAtDB.rows.length).toBe(1);
	expect(accountAtDB.rows[0].stripe_account_id).toEqual(accountData.id);
	expect(accountAtDB.rows[0].account_object).toEqual(accountData);
});

test('generateAccount (connected account for payouts) in TR', async () => {
	let publicDomain = "http://localhost:3000";
	let refreshUrlRoute = "/account-authorize";
	let returnUrlRoute = "/account-generated";

	let now = Date.now();
	let email = `${now}@yopmail.com`;
	const props = {
		email: email,
		publicDomain: publicDomain,
		refreshUrlRoute: refreshUrlRoute,
		returnUrlRoute: returnUrlRoute,
		country: "TR",
	};
	let response1 = await tsb.generateAccount(props);
	let accountData = response1.payload;
	tickLog.info(`Account generated with following significant information:\n   id:                  ${accountData.id}\n   type:                ${accountData.type}\n   capabilities:        ${JSON.stringify(accountData.capabilities)}\n   email:               ${accountData.email}\n   Payment Schedule:    ${JSON.stringify(accountData.settings.payouts.schedule)}\n   accountLinkURL:      ${accountData.accountLinkURL}`, true);
	expect(accountData.id).not.toBeNull();
	expect(accountData.type).toEqual('express');
	// jest compare object
	expect(accountData.capabilities).toEqual({ "transfers": "inactive" });
	expect(accountData.email).toEqual(email);
	expect(accountData.settings.payouts.schedule.interval).toEqual('daily');
	let accountAtDB = await runSQL(poolName, sqls.selectAccount, [accountData.id], debugMode);
	expect(accountAtDB.rows.length).toBe(1);
	expect(accountAtDB.rows[0].stripe_account_id).toEqual(accountData.id);
	expect(accountAtDB.rows[0].account_object).toEqual(accountData);
});

test('completeAccount', async () => {
	let publicDomain = "http://localhost:3000";
	let refreshUrlRoute = "/account-authorize";
	let returnUrlRoute = "/account-generated";

	let now = Date.now();
	let email = `${now}@yopmail.com`;
	const props = {
		email: email,
		publicDomain: publicDomain,
		refreshUrlRoute: refreshUrlRoute,
		returnUrlRoute: returnUrlRoute,
	};
	let response1 = await tsb.generateAccount(props);
	let accountData = response1.payload;
	tickLog.info(`Account generated with following significant information:\n   id:                  ${accountData.id}\n   type:                ${accountData.type}\n   capabilities:        ${JSON.stringify(accountData.capabilities)}\n   email:               ${accountData.email}\n   Payment Schedule:    ${JSON.stringify(accountData.settings.payouts.schedule)}\n   accountLinkURL:      ${accountData.accountLinkURL}`, true);
	expect(accountData.id).not.toBeNull();
	expect(accountData.type).toEqual('express');
	// jest compare object
	expect(accountData.capabilities).toEqual({ "transfers": "inactive" });
	expect(accountData.email).toEqual(email);
	expect(accountData.settings.payouts.schedule.interval).toEqual('daily');
	let accountAtDB = await runSQL(poolName, sqls.selectAccount, [accountData.id], debugMode);
	expect(accountAtDB.rows.length).toBe(1);
	expect(accountAtDB.rows[0].stripe_account_id).toEqual(accountData.id);
	expect(accountAtDB.rows[0].account_object).toEqual(accountData);
	let props2 = {
		accountId: accountData.id,
		publicDomain: publicDomain,
		refreshUrlRoute: refreshUrlRoute,
		returnUrlRoute: returnUrlRoute,
	}
	let completeAccountResponse = await tsb.completeAccount(props2);
	let uriRegExp = new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/);
	expect(completeAccountResponse.payload.match(uriRegExp)).toBeTruthy();
	tickLog.info(`completeAccount URI: ${completeAccountResponse.payload}`);
});

test('paymentSheetHandler normal payment', async () => {
	let now = Date.now();
	let email = `${now}@yopmail.com`;
	let description = `Generated by JEST tests. Customer ${now}`;
	let metadata = {
		"testField": "testValue1",
		"testField2": "testValue2"
	};
	let name = `Customer ${now}`;
	let phone = `+1 555 555 5555`;
	let address =
	{
		city: "San Francisco",
		country: "US",
		line1: "1234 Main Street",
		line2: "Apt. 4",
		postal_code: "94111",
		state: "CA"
	}
	const props = {
		description, email, metadata, name, phone, address
	};
	let response1 = await tsb.generateCustomer(props);
	let customerData = response1.payload;
	tickLog.info(`Customer generated with following significant information:\n   id:                  ${customerData.id}\n   object:              ${JSON.stringify(customerData.object)}\n   email:               ${customerData.email}\n   metadata:            ${JSON.stringify(customerData.metadata)}\n   name:                ${customerData.name}\n   phone:               ${customerData.phone}\n   address:             ${JSON.stringify(customerData.address)}\n   livemode:            ${customerData.livemode}`, true);
	let customerId = customerData.id;
	let payInAmount = 1000;
	let currency = 'usd'
	//let transferData
	//let payoutData
	// 		let { customerId, payInAmount, currency, transferData, payoutData } = props;
	let paymentSheet_ = await tsb.paymentSheetHandler({ customerId, payInAmount, currency });
	let paymentSheet = paymentSheet_.payload;
	tickLog.info(`Generated Payment Sheet: ${JSON.stringify(paymentSheet)}}`, true);
	expect(paymentSheet).toHaveProperty('paymentIntent');
	expect(paymentSheet).toHaveProperty('ephemeralKey');
	expect(paymentSheet).toHaveProperty('customer');
	expect(paymentSheet).toHaveProperty('publishableKey');
	expect(paymentSheet.customer).toBe(customerId);
	let paymentSheetAtDB = await runSQL(poolName, sqls.selectPaymentSheets, [customerData.id], debugMode);
	expect(paymentSheetAtDB.rows.length).toBeGreaterThanOrEqual(1);
	expect(paymentSheetAtDB.rows[0].stripe_customer_id).toEqual(customerData.id);
	expect(parseFloat(paymentSheetAtDB.rows[0].pay_in_amount)).toEqual(payInAmount);
	expect(paymentSheetAtDB.rows[0].payout_stripe_account_id).toBe(null);
	expect(paymentSheetAtDB.rows[0].pay_out_amount).toBe(null);
});

test('paymentSheetHandler payment with payout', async () => {
	let now = Date.now();
	let email = `${now}@yopmail.com`;
	let description = `Generated by JEST tests. Customer ${now}`;
	let metadata = {
		"testField": "testValue1",
		"testField2": "testValue2"
	};
	let name = `Customer ${now}`;
	let phone = `+1 555 555 5555`;
	let address =
	{
		city: "San Francisco",
		country: "US",
		line1: "1234 Main Street",
		line2: "Apt. 4",
		postal_code: "94111",
		state: "CA"
	}
	const props = {
		description, email, metadata, name, phone, address
	};
	let response1 = await tsb.generateCustomer(props);
	let customerData = response1.payload;
	tickLog.info(`Customer generated with following significant information:\n   id:                  ${customerData.id}\n   object:              ${JSON.stringify(customerData.object)}\n   email:               ${customerData.email}\n   metadata:            ${JSON.stringify(customerData.metadata)}\n   name:                ${customerData.name}\n   phone:               ${customerData.phone}\n   address:             ${JSON.stringify(customerData.address)}\n   livemode:            ${customerData.livemode}`, true);
	let now2 = Date.now() + '-connected-account';
	let email2 = `${now2}@yopmail.com`;
	let publicDomain2 = "http://localhost:3000";
	let refreshUrlRoute2 = "/account-authorize";
	let returnUrlRoute2 = "/account-generated";
	const props2 = {
		email: email2,
		publicDomain: publicDomain2,
		refreshUrlRoute: refreshUrlRoute2,
		returnUrlRoute: returnUrlRoute2,
	};
	let response2 = await tsb.generateAccount(props2);
	let accountData = response2.payload;
	tickLog.info(`Account generated with following significant information:\n   id:                  ${accountData.id}\n   type:                ${accountData.type}\n   capabilities:        ${JSON.stringify(accountData.capabilities)}\n   email:               ${accountData.email}\n   Payment Schedule:    ${JSON.stringify(accountData.settings.payouts.schedule)}\n   accountLinkURL:      ${accountData.accountLinkURL}`, true);
	let customerId = customerData.id;
	let payInAmount = 1000; // total amount to be chaged to CUSTOMER
	let currency = 'usd'
	let payoutData = {
		amount: 877, // partner's share
		destination: accountData.id, // CONNECTED ACCOUNT id
	};
	let paymentSheet_ = await tsb.paymentSheetHandler({ customerId, payInAmount, currency, payoutData });
	let paymentSheet = paymentSheet_.payload;;
	tickLog.info(`Generated Payment Sheet: ${JSON.stringify(paymentSheet)}}`, true);
	expect(paymentSheet).toHaveProperty('paymentIntent');
	expect(paymentSheet).toHaveProperty('ephemeralKey');
	expect(paymentSheet).toHaveProperty('customer');
	expect(paymentSheet).toHaveProperty('publishableKey');
	expect(paymentSheet.customer).toBe(customerId);
	let paymentSheetAtDB = await runSQL(poolName, sqls.selectPaymentSheets, [customerData.id], debugMode);
	expect(paymentSheetAtDB.rows.length).toBeGreaterThanOrEqual(1);
	expect(paymentSheetAtDB.rows[0].stripe_customer_id).toEqual(customerData.id);
	expect(parseFloat(paymentSheetAtDB.rows[0].pay_in_amount)).toEqual(payInAmount);
	expect(paymentSheetAtDB.rows[0].payout_stripe_account_id).toBe(accountData.id);
	expect(parseFloat(paymentSheetAtDB.rows[0].pay_out_amount)).toBe(payoutData.amount);
});

test('paymentSheetHandler payment with payout and on_behalf_of', async () => {
	let now = Date.now();
	let email = `${now}@yopmail.com`;
	let description = `Generated by JEST tests. Customer ${now}`;
	let metadata = {
		"testField": "testValue1",
		"testField2": "testValue2"
	};
	let name = `Customer ${now}`;
	let phone = `+1 555 555 5555`;
	let address =
	{
		city: "San Francisco",
		country: "US",
		line1: "1234 Main Street",
		line2: "Apt. 4",
		postal_code: "94111",
		state: "CA"
	}
	const props = {
		description, email, metadata, name, phone, address
	};
	let response1 = await tsb.generateCustomer(props);
	let customerData = response1.payload;
	tickLog.info(`Customer generated with following significant information:\n   id:                  ${customerData.id}\n   object:              ${JSON.stringify(customerData.object)}\n   email:               ${customerData.email}\n   metadata:            ${JSON.stringify(customerData.metadata)}\n   name:                ${customerData.name}\n   phone:               ${customerData.phone}\n   address:             ${JSON.stringify(customerData.address)}\n   livemode:            ${customerData.livemode}`, true);
	let now2 = Date.now() + '-connected-account';
	let email2 = `${now2}@yopmail.com`;
	let publicDomain2 = "http://localhost:3000";
	let refreshUrlRoute2 = "/account-authorize";
	let returnUrlRoute2 = "/account-generated";
	const props2 = {
		email: email2,
		publicDomain: publicDomain2,
		refreshUrlRoute: refreshUrlRoute2,
		returnUrlRoute: returnUrlRoute2,
	};
	let response2 = await tsb.generateAccount(props2);
	let accountData = response2.payload;
	tickLog.info(`Account generated with following significant information:\n   id:                  ${accountData.id}\n   type:                ${accountData.type}\n   capabilities:        ${JSON.stringify(accountData.capabilities)}\n   email:               ${accountData.email}\n   Payment Schedule:    ${JSON.stringify(accountData.settings.payouts.schedule)}\n   accountLinkURL:      ${accountData.accountLinkURL}`, true);
	let customerId = customerData.id;
	let payInAmount = 1000; // total amount to be chaged to CUSTOMER
	let currency = 'usd'
	let payoutData = {
		amount: 877, // partner's share
		destination: accountData.id, // CONNECTED ACCOUNT id
	};
	let on_behalf_of = accountData.id;
	let paymentSheet_ = await tsb.paymentSheetHandler({ customerId, payInAmount, currency, payoutData, on_behalf_of });
	let paymentSheet = paymentSheet_.payload;;
	tickLog.info(`Generated Payment Sheet ON BEHALF OF: ${on_behalf_of}\n\n ${JSON.stringify(paymentSheet)}}`, true);
	expect(paymentSheet).toHaveProperty('paymentIntent');
	expect(paymentSheet).toHaveProperty('ephemeralKey');
	expect(paymentSheet).toHaveProperty('customer');
	expect(paymentSheet).toHaveProperty('publishableKey');
	expect(paymentSheet.customer).toBe(customerId);
	let paymentSheetAtDB = await runSQL(poolName, sqls.selectPaymentSheets, [customerData.id], debugMode);
	expect(paymentSheetAtDB.rows.length).toBeGreaterThanOrEqual(1);
	expect(paymentSheetAtDB.rows[0].stripe_customer_id).toEqual(customerData.id);
	expect(parseFloat(paymentSheetAtDB.rows[0].pay_in_amount)).toEqual(payInAmount);
	expect(paymentSheetAtDB.rows[0].payout_stripe_account_id).toBe(accountData.id);
	expect(parseFloat(paymentSheetAtDB.rows[0].pay_out_amount)).toBe(payoutData.amount);
});

test('generateCheckoutForSubscription', async () => {
	let now = Date.now();
	let email = `${now}@yopmail.com`;
	let description = `Generated by JEST tests. Customer ${now}`;
	let metadata = {
		"testField": "testValue1",
		"testField2": "testValue2"
	};
	let name = `Customer ${now}`;
	let phone = `+90 555 555 5555`;
	let address =
	{
		city: "Istanbul",
		country: "TR",
		line1: "Ortaklar Caddesi",
		line2: "Apt. 4",
		postal_code: "34500",
	}
	const props = {
		description, email, metadata, name, phone, address
	};
	let response1 = await tsb.generateCustomer(props);
	let customerData = response1.payload;
	tickLog.info(`Customer generated with following significant information:\n   id:                  ${customerData.id}\n   object:              ${JSON.stringify(customerData.object)}\n   email:               ${customerData.email}\n   metadata:            ${JSON.stringify(customerData.metadata)}\n   name:                ${customerData.name}\n   phone:               ${customerData.phone}\n   address:             ${JSON.stringify(customerData.address)}\n   livemode:            ${customerData.livemode}`, true);
	expect(customerData).toHaveProperty('id');
	expect(customerData).toHaveProperty('object');
	expect(customerData).toHaveProperty('description');
	expect(customerData).toHaveProperty('email');
	expect(customerData).toHaveProperty('livemode');
	expect(customerData).toHaveProperty('metadata');
	expect(customerData).toHaveProperty('name');
	expect(customerData).toHaveProperty('phone');
	expect(customerData).toHaveProperty('address');
	expect(customerData.email).toEqual(email);
	let customerAtDB = await runSQL(poolName, sqls.selectCustomer, [customerData.id], debugMode);
	expect(customerAtDB.rows.length).toBe(1);
	expect(customerAtDB.rows[0].stripe_customer_id).toEqual(customerData.id);
	expect(customerAtDB.rows[0].customer_object).toEqual(customerData);

	let productName = `Product ${now}`;
	let productDescription = `Generated by JEST tests. Product ${now}`;
	let productCurrency = 'usd';
	let productAmount = "100001";
	let productProps = {
		name: productName,
		description: productDescription,
		currency: productCurrency,
		unitAmountDecimal: productAmount
	};
	let response = await tsb.generateProduct(productProps);
	let productData = response.payload.product;
	tickLog.info(`Product generated with following significant information:\n   id:                  ${productData.id}\n   name:                ${productData.name}\n   description:         ${productData.description}\n   type:                ${productData.type}\n   default_price:       ${productData.default_price}\n   livemode:            ${productData.livemode}`, true);
	expect(productData).toHaveProperty('id');
	expect(productData.name).toBe(productName);

	let stripeProductName = productData.name;
	let currency = 'usd';
	let unitAmountDecimal = "100003";
	let publicDomain = "http://development.eseme.one:61800";
	let successRoute = "/checkout-success";
	let cancelRoute = "/checkout-cancel";

	let checkoutResponse = await tsb.generateCheckoutForSubscription({
		stripeProductName: stripeProductName,
		currency: currency,
		unitAmountDecimal,
		publicDomain,
		successRoute,
		cancelRoute,
	});
	tickLog.info(`checkoutResponse: ${JSON.stringify(checkoutResponse, null, 2)}`); // deleteme

});


test('generateSubscription', async () => {
	let now = Date.now();
	let email = `${now}@yopmail.com`;
	let description = `Generated by JEST tests. Customer ${now}`;
	let metadata = {
		"testField": "testValue1",
		"testField2": "testValue2"
	};
	let name = `Customer ${now}`;
	let phone = `+90 555 555 5555`;
	let address =
	{
		city: "Istanbul",
		country: "TR",
		line1: "Ortaklar Caddesi",
		line2: "Apt. 4",
		postal_code: "34500",
	}
	const props = {
		description, email, metadata, name, phone, address
	};
	let response1 = await tsb.generateCustomer(props);
	let customerData = response1.payload;
	tickLog.info(`Customer generated with following significant information:\n   id:                  ${customerData.id}\n   object:              ${JSON.stringify(customerData.object)}\n   email:               ${customerData.email}\n   metadata:            ${JSON.stringify(customerData.metadata)}\n   name:                ${customerData.name}\n   phone:               ${customerData.phone}\n   address:             ${JSON.stringify(customerData.address)}\n   livemode:            ${customerData.livemode}`, true);
	expect(customerData).toHaveProperty('id');
	expect(customerData).toHaveProperty('object');
	expect(customerData).toHaveProperty('description');
	expect(customerData).toHaveProperty('email');
	expect(customerData).toHaveProperty('livemode');
	expect(customerData).toHaveProperty('metadata');
	expect(customerData).toHaveProperty('name');
	expect(customerData).toHaveProperty('phone');
	expect(customerData).toHaveProperty('address');
	expect(customerData.email).toEqual(email);
	let customerAtDB = await runSQL(poolName, sqls.selectCustomer, [customerData.id], debugMode);
	expect(customerAtDB.rows.length).toBe(1);
	expect(customerAtDB.rows[0].stripe_customer_id).toEqual(customerData.id);
	expect(customerAtDB.rows[0].customer_object).toEqual(customerData);

	let productName = `Product ${now}`;
	let productDescription = `Generated by JEST tests. Product ${now}`;
	let productCurrency = 'usd';
	let productAmount = "100001";
	let productProps = {
		name: productName,
		description: productDescription,
		currency: productCurrency,
		unitAmountDecimal: productAmount,
		interval: 'month',
	};
	let response2 = await tsb.generateProduct(productProps);
	let productData = response2.payload.product;
	let priceData = response2.payload.price;
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
		customerId: customerData.id,
		recurringPriceId: priceData.id
	});
	tickLog.info(`response3: ${JSON.stringify(response3, null, 2)}`); // deleteme
	
});
