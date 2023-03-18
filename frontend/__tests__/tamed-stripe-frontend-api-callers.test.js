const tickLog = require("tick-log");
const tsf = require("../tamed-stripe-frontend-api-callers.js");

const debugMode = true; // true 

const apiBackend = "https://development.eseme.one:61983";

const applicationCustomerId = `Frontend Jest Test Customer-${(new Date()).getTime()}`;

// The following items are coming from BACKEND TESTS STEP 1
const customerId = 'cus_NXM3AR5EfpIS7C';
const accountId_TR = "acct_1MmHL3Fw4152XXeh";
const accountId_FR = "acct_1MmHL5C23xTzM4MY";

jest.setTimeout(10000);

beforeAll(async () => {
	tsf.init({
		apiBackend: apiBackend,
		routes: {
			"generateCustomer": "/generate-customer",
			"generateSubscription": "/generate-subscription",
			"generateProduct": "/generate-product",
			"generateAccount": "/generate-account",
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
});