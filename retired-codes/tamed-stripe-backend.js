const sqls = require('./sqls.json');
const uiTexts = require('./ui-texts-english.json');
const stripeSK = require('./config.js').secretKey;
const stripePK = require('./config.js').publishableKey;
const stripe = require('stripe')(stripeSK);

const { connect, runSQL } = require('tamed-pg');
const tickLog = require('tick-log');

let poolName;
const poolInfoForTests = {};
let debugMode = true;

const init = (p_params) => new Promise(async (resolve, reject) => {
	try {
		debugMode = p_params.debugMode;
		poolName = await connect(p_params.pgKeys);
		poolInfoForTests.poolName = poolName;
		/* istanbul ignore next */
		return resolve(true);
	} catch (error) /* istanbul ignore next */ {
		tickLog.error(`Function init failed. Error: ${JSON.stringify(error)}`, true);
		return reject(uiTexts.unknownError);
	}
});

const generateCustomer = (body) => new Promise(async (resolve, reject) => {
	try {
		let { description, email, metadata, name, phone, address, publicDomain, successRoute, cancelRoute } = body;
		// {CHECKOUT_SESSION_ID} is to be used by Stripe, DON'T modify it!
		let successUrl = `${publicDomain}${successRoute}?session_id={CHECKOUT_SESSION_ID}`;
		let cancelUrl = `${publicDomain}${cancelRoute}`;
		
		let lowCaseEmail = email.toLowerCase().trim();
		const customer = await stripe.customers.create({
			description,
			email: lowCaseEmail,
			metadata,
			name,
			phone,
			address,
		});
		const checkoutSession = await stripe.checkout.sessions.create({
			payment_method_types: ['card'],
			mode: 'setup',
			customer: customer.id,
			success_url: successUrl,
			cancel_url: cancelUrl,
		});
		/* istanbul ignore next */
		if (debugMode) {
			tickLog.success(`generated customer: ${JSON.stringify(customer)}`, true);
			tickLog.success(`generated setup intent: ${JSON.stringify(setupIntent)}`, true);
		}
		let countResult = await runSQL(poolName, sqls.customerExists, [customer.id]);
		/* istanbul ignore next */
		if (debugMode) tickLog.info(`Database select result: ${JSON.stringify(countResult)}`, true);
		if (parseInt(countResult.rows[0].count) === 0) await runSQL(poolName, sqls.insertCustomer, [customer.id, customer.email, customer.name, customer.phone, customer.address, JSON.stringify(customer.metadata), JSON.stringify(customer)]);
		else /* istanbul ignore next */ { };
		return resolve({
			result: 'OK',
			payload: customer,
		});
	} catch (error) /* istanbul ignore next */ {
		if (debugMode) tickLog.error(`tamed-stripe-backend related error. Failure while calling generateCustomer(${JSON.stringify(body)}). Error: ${JSON.stringify(error)}`, true);
		return reject(error);
	}
});

const generateProduct = (body) => new Promise(async (resolve, reject) => {
	try {
		const { name, description, currency, unitAmountDecimal, interval } = body;
		// interval can be one of day, week, month, or year
		const product = await stripe.products.create({ name, description });
		const priceData = {
			product: product.id,
			unit_amount_decimal: unitAmountDecimal,
			currency: currency,
		}
		if (['day', 'week', 'month', 'year'].includes(interval)) priceData.recurring = { interval };
		const price = await stripe.prices.create(priceData);
		if (debugMode) tickLog.success(`generated product: ${JSON.stringify(product)}`, true);
		if (debugMode) tickLog.success(`generated price: ${JSON.stringify(price)}`, true);
		const insertResult = await runSQL(poolName, sqls.insertProduct, [product.id, name, description, currency, unitAmountDecimal, (interval ? interval : ''), JSON.stringify(product), JSON.stringify(price)]);
		if (debugMode) tickLog.info(`Database select result: ${JSON.stringify(insertResult)}`, true);
		return resolve({
			result: 'OK',
			payload: {
				product,
				price
			},
		});
	} catch (error) /* istanbul ignore next */ {
		if (debugMode) tickLog.error(`tamed-stripe-backend related error. Failure while calling generateProduct(${JSON.stringify(body)}). Error: ${JSON.stringify(error)}`, true);
		return reject(error);
	}
});

const completeAccount = (body) => new Promise(async (resolve, reject) => {
	try {
		let { accountId, publicDomain, refreshUrlRoute, returnUrlRoute } = body;
		let refreshUrl = `${publicDomain}${refreshUrlRoute || '/account-authorize'}`;
		let returnUrl = `${publicDomain}${returnUrlRoute || '/account-generated'}`
		const accountLink = await stripe.accountLinks.create({
			account: accountId,
			refresh_url: refreshUrl,
			return_url: returnUrl,
			type: 'account_onboarding'
		});
		let accountLinkURL = accountLink.url;
		return resolve({
			result: 'OK',
			payload: accountLinkURL,
		});
	} catch (error) /* istanbul ignore next */ {
		if (debugMode) tickLog.error(`tamed-stripe-backend related error. Failure while calling generateAccount(${JSON.stringify(body)}). Error: ${JSON.stringify(error)}`, true);
		return reject(error);
	}
});

const generateAccount = (body) => new Promise(async (resolve, reject) => {
	let { email, publicDomain, refreshUrlRoute, returnUrlRoute, country, capabilities } = body;
	try {
		let country_ = country ? country : 'US';
		let tos_acceptance = country_ === 'US' ? undefined : { service_agreement: 'recipient' };
		const accountGenerationParams = {
			type: 'express',
			email: email,
			capabilities: /* istanbul ignore next */ capabilities ? capabilities : { transfers: { requested: true } },
			tos_acceptance: tos_acceptance,
			country: country ? country : 'US',
			settings: {
				payouts: {
					schedule: {
						delay_days: 'minimum'
					}
				}
			}
		};
		const account = await stripe.accounts.create(accountGenerationParams);
		/* istanbul ignore next */
		if (debugMode) tickLog.success(`generated account: ${JSON.stringify(account)}`, true);
		let refreshUrl = `${publicDomain}${refreshUrlRoute || '/account-authorize'}`;
		let returnUrl = `${publicDomain}${returnUrlRoute || '/account-generated'}`
		const accountLink = await stripe.accountLinks.create({
			account: account.id,
			refresh_url: refreshUrl,
			return_url: returnUrl,
			type: 'account_onboarding'
		});
		account.accountLinkURL = accountLink.url;
		if (debugMode) tickLog.success(`generated accountLink.url: ${accountLink.url}`, true);
		let countResult = await runSQL(poolName, sqls.connectedAccountsExists, [account.id]);
		if (debugMode) tickLog.info(`Database select result: ${JSON.stringify(countResult)}`, true);
		if (parseInt(countResult.rows[0].count) === 0) {
			// insert
			// (stripe_customer_id, email, name, phone, address, metadata, customer_object) 
			let insertResult = await runSQL(poolName, sqls.insertConnectedAccount, [account.id, JSON.stringify(account.capabilities), account.email, JSON.stringify(account.settings.payouts.schedule), JSON.stringify(account)]);
		} else /* istanbul ignore next */ {
			// can not come here
			// placed just to satisfy istanbul
		};
		return resolve({
			result: 'OK',
			payload: account,
		});
	} catch (error) /* istanbul ignore next */ {
		if (debugMode) tickLog.error(`tamed-stripe-backend related error. Failure while calling generateAccount(${JSON.stringify(body)}). Error: ${JSON.stringify(error)}`, true);
		return reject(error);
	}
});

// USED both for normal payments and payouts
const paymentSheetHandler = (body) => new Promise(async (resolve, reject) => {
	try {
		let { customerId, payInAmount, currency, payoutData, on_behalf_of } = body;
		let transferData = undefined;
		if (payoutData) transferData = {
			amount: payoutData.payoutAmount,
			destination: payoutData.payoutAccountId,
		};
		let paymentIntentParams = {
			amount: payInAmount,
			currency: currency,
			customer: customerId,
			automatic_payment_methods: {
				enabled: true,
			},
		};
		if (transferData) {
			paymentIntentParams.transfer_data = transferData;
			if (on_behalf_of) paymentIntentParams.on_behalf_of = on_behalf_of;
		}
		const ephemeralKey = await stripe.ephemeralKeys.create(
			{ customer: customerId },
			{ apiVersion: '2022-11-15' }
		);
		const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
		/* istanbul ignore next */
		if (debugMode) tickLog.success(`generated ephemeralKey: ${JSON.stringify(ephemeralKey)}`, true);
		/* istanbul ignore next */
		if (debugMode) tickLog.success(`generated paymentIntent: ${JSON.stringify(paymentIntent)}`, true);
		let insertResult = await runSQL(poolName, sqls.insertPaymentSheet, [customerId, payInAmount, currency, payoutData?.destination /*account id*/, payoutData?.amount, ephemeralKey.secret]);
		return resolve({
			result: 'OK',
			payload: {
				paymentIntent: paymentIntent.client_secret,
				ephemeralKey: ephemeralKey.secret,
				customer: customerId,
				publishableKey: stripePK
			},
		});
	} catch (error) /* istanbul ignore next */ {
		return reject(error);
	}
});


const generateSubscription = (body) => new Promise(async (resolve, reject) => {
	try {
		let { customerId, recurringPriceId } = body;
		const subscription = await stripe.subscriptions.create({
			customer: customerId,
			items: [{ price: recurringPriceId }]
		});
		/* istanbul ignore next */
		if (debugMode) tickLog.success(`generated subscription: ${JSON.stringify(subscription)}`, true);
		return resolve({
			result: 'OK',
			payload: subscription,
		});
	} catch (error) /* istanbul ignore next */ {
		return reject(error);
	}
});

const generateCheckoutForSubscription = (body) => new Promise(async (resolve, reject) => {
	try {
		let { stripeProductName, currency, unitAmountDecimal, publicDomain, successRoute, cancelRoute } = body;
		// {CHECKOUT_SESSION_ID} is to be used by Stripe, DON'T modify it!
		let successUrl = `${publicDomain}${successRoute}?session_id={CHECKOUT_SESSION_ID}`;
		let cancelUrl = `${publicDomain}${cancelRoute}`;

		const subscriptionCheckoutSession = await await stripe.checkout.sessions.create({
			mode: 'subscription',
			payment_method_types: ['card'],
			line_items: [
				{
					price_data: {
						currency: currency,
						product_data: {
							name: stripeProductName, // product name
						},
						recurring: {
							interval: 'month', // Set the billing cycle to monthly
						},
						unit_amount_decimal: unitAmountDecimal,
					},
					quantity: 1,
				},
			],
			success_url: successUrl,
			cancel_url: cancelUrl,
		});

		/* istanbul ignore next */
		if (debugMode) tickLog.success(`generated subscriptionCheckoutSession: ${JSON.stringify(subscriptionCheckoutSession)}`, true);
		//let insertResult = await runSQL(poolName, sqls.insertSubscription, [subscription.id, subscription.customer, subscription.items.data[0].price.id, JSON.stringify(subscription.metadata), JSON.stringify(subscription)]);
		//if (debugMode) tickLog.success(`generated subscription, DB insert result ${JSON.stringify(insertResult)}`, true);
		return resolve({
			result: 'OK',
			payload: subscriptionCheckoutSession,
		});
	} catch (error) /* istanbul ignore next */ {
		if (debugMode) tickLog.error(`tamed-stripe-backend related error. Failure while calling generateCheckoutForSubscription(${JSON.stringify(body)}). Error: ${JSON.stringify(error)}`, true);
		return reject(error);
	}
});

/* istanbul ignore next */
const webhook = (body) => new Promise(async (resolve, reject) => {
	try {
		let event = body;
		tickLog.info(`Webhook received: ${JSON.stringify(event)}`, true);
		switch (event.type) {
			case 'payment_intent.succeeded':
				break;
			case 'payment_intent.payment_failed':
				break;
			case 'payment_intent.refunded':
				break;
			case 'account.application.authorized':
				break;
			case 'account.application.deauthorized':
				break;
			case 'account.updated':
				break;
			case 'customer.application.authorized':
				break;
			default:
				break;
		}

		return resolve({
			result: 'OK',
			payload: undefined,
		});
	} catch (error) {
		return reject(error);
	}
});

module.exports = {
	init,
	generateAccount,
	completeAccount,
	generateCustomer,
	generateProduct,
	paymentSheetHandler,
	generateSubscription,
	generateCheckoutForSubscription,
	webhook,
	exportedForTesting: {
		poolInfoForTests: poolInfoForTests,
	}
}