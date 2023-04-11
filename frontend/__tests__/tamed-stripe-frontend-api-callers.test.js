const tickLog = require("tick-log");
const tsf = require("../tamed-stripe-frontend-api-callers.js");

const debugMode = false;

const apiBackend = "https://development.eseme.one:61983";

const applicationCustomerId = `Frontend Jest Test Customer-${(new Date()).getTime()}`;

// The following items are coming from BACKEND TESTS STEP 1
// REPLACE AREA
const customerId = 'cus_NZz7DUmOV3mtaB';
const accountId_TR = "acct_1Mop9ECDNsGA70wp";
// END OF REPLACE AREA

beforeAll(async () => {
	tsf.init({
		apiBackend: apiBackend,
		routes: {
			"generateCustomer": "/generate-customer",
			"getCustomer": "/get-customer",
			"generateSubscription": "/generate-subscription",
			"generateProduct": "/generate-product",
			"generateAccount": "/generate-account",
			"getAccount": "/get-account",
			"oneTimePayment": "/one-time-payment",
			"getOneTimePaymentStatus": "/get-one-time-payment-status",
			"getSubscriptionPaymentsByStripeCustomerId": "/test/get-subscription-payments-by-stripe-customer-id",
		},
		debugMode: true
	});
});

test('generateCustomer', async () => {
	const now = new Date().getTime();
	const result = await tsf.generateCustomer({
		applicationCustomerId: applicationCustomerId,
		description: `Mobile App Test Customer ${now}`,
		email: `Frontend-Jest-Test-${now}@yopmail.com`,
		metadata: { "test": "test" },
		name: `Mobile App Test Customer ${now}`,
		phone: `1234567890`,
		address: { "line1": "1234 Main St", "city": "San Francisco", "state": "CA", "postal_code": "94111" },
		publicDomain: apiBackend,
	});
	tickLog.info(`generateCustomer: ${JSON.stringify(result)}`);
	expect(result.payload.customer.id.length).toBeGreaterThan(0);
	expect(result.payload.checkoutSession.url.length).toBeGreaterThan(30);
});

test('getCustomer should rely on backend tests because it requires (A) Active customer', async () => {
});


test('generateSubscription', async () => {
	const now = new Date().getTime();
	const resultProduct = await tsf.generateProduct({
		name: `Frontend Jest Test Product ${now}`,
		description: `Frontend Jest Test Product ${now}`,
		currency: 'usd',
		unitAmountDecimal: `1234567`,
		interval: 'month',
	});
	const resultSubscription = await tsf.generateSubscription({
		customerId: customerId,
		recurringPriceId: resultProduct.payload.price.id,
		description: `Frontend Jest Subscription - ${now}`,
	});
	tickLog.info(`Subscription : ${JSON.stringify(resultSubscription.payload, null, 2)}`, true);
	// wait 10 seconds for the webhook to fire
	await new Promise(resolve => setTimeout(resolve, 3000));
	const payments = await tsf.exportedForTesting.getSubscriptionPaymentsByStripeCustomerId({
		customerId: customerId
	});
	tickLog.info(`Payments : ${JSON.stringify(payments.payload, null, 2)}`, true);
	expect(payments.payload[0].hosted_invoice_url.length).toBeGreaterThan(30);
}, 10000);

test('generateAccount', async () => {
	const now = new Date().getTime();
	const account = await tsf.generateAccount({
		applicationCustomerId: applicationCustomerId,
		email: `Frontend-Jest-Tes-Account-${now}@yopmail.com`,
		publicDomain:  apiBackend,
		country: 'TR',
	});
	expect(account.payload.id.length).toBeGreaterThan(10);
	expect(account.payload.accountLinkURL.length).toBeGreaterThan(30);
});

test('getAccount', async () => {
	const now = new Date().getTime();
	const account = await tsf.generateAccount({
		applicationCustomerId: applicationCustomerId,
		email: `Frontend-Jest-Tes-Account-${now}@yopmail.com`,
		publicDomain:  apiBackend,
		country: 'TR',
	});
	const result = await tsf.getAccount({
		applicationCustomerId
	});
	expect(result.payload.stripe_account_id).toBe(account.payload.id);
});

test('oneTimePayment', async () => {
	const payoutData = {
		payoutAmount: "12345",
		payoutAccountId: accountId_TR
	}
	const items = [
		{ name: `Frontend Jest Test Item 1`, unitAmountDecimal: `11111111`, },
		{ name: `Frontend Jest Test Item 2`, unitAmountDecimal: `22222222`, },
	];
	const body = {
		applicationCustomerId: applicationCustomerId,
		customerId: customerId,
		currency: 'usd',
		items: items,
		payoutData: payoutData,
		publicDomain: apiBackend,
	};

	const result = await tsf.oneTimePayment(body);
	console.log(`One Time Payment Checkout : ${JSON.stringify(result.payload, null, 2)}`);
	expect(result.payload.url.length).toBeGreaterThan(30);

	const checkoutSessionId = result.payload.id;
	const result2 = await tsf.getOneTimePaymentStatus({checkoutSessionId});
	console.log(`One Time Payment Status : ${JSON.stringify(result2.payload.rows[0], null, 2)}`);
	expect(result2.payload.rows[0].payout_amount).toBe(payoutData.payoutAmount);
});