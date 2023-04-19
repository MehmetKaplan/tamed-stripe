const sqls = require('./sqls.js');
const uiTexts = require('./ui-texts-english.json');
const stripeSK = require('./config.js').secretKey;
const stripePK = require('./config.js').publishableKey;
const stripe = require('stripe')(stripeSK);

const { connect, runSQL } = require('tamed-pg');
const tickLog = require('tick-log');

let poolName;
const poolInfoForTests = {};

let debugMode; // will be set in init()

const closePage = (content, duration) => {
	/* istanbul ignore next */
	return `
		<html>
			<script>setTimeout(function() {window.location='web-view-close'}, ${duration});</script>
			<body style:{width:80%;	margin-left:auto;	margin-right:auto;}>${content}</body>
		</html>
	`.replace(/\t/g, '').replace(/\n/g, '').replace(/\s\s+/g, ' ');
};

const webViewClose = (body) => new Promise(async (resolve, reject) => {
	/* istanbul ignore next */
	return resolve(`<p>Please Close This Window</p>`);
});

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
		let { applicationCustomerId, paymentMethodId, description, email, metadata, name, phone, address, publicDomain, successRoute, cancelRoute, testClockId } = body;
		// {CHECKOUT_SESSION_ID} is to be used by Stripe, DON'T modify it!
		/* istanbul ignore next */
		let successUrl = `${publicDomain}${successRoute || "/generate-customer-success-route"}?session_id={CHECKOUT_SESSION_ID}`;
		/* istanbul ignore next */
		let cancelUrl = `${publicDomain}${cancelRoute || "/generate-customer-cancel-route"}?session_id={CHECKOUT_SESSION_ID}`;

		let lowCaseEmail = email.toLowerCase().trim();
		const customerParameters = {
			description,
			email: lowCaseEmail,
			metadata,
			name,
			phone,
			address,
		};
		/* istanbul ignore else */
		if (paymentMethodId) {
			customerParameters.payment_method = paymentMethodId;
			customerParameters.invoice_settings = { default_payment_method: paymentMethodId };
		}
		/* istanbul ignore else */
		if (testClockId) customerParameters.test_clock = testClockId;
		const customer = await stripe.customers.create(customerParameters);
		const checkoutSession = paymentMethodId ? undefined : await stripe.checkout.sessions.create({
			payment_method_types: ['card'],
			mode: 'setup',
			customer: customer.id,
			success_url: successUrl,
			cancel_url: cancelUrl,
		});
		/* istanbul ignore next */
		if (debugMode) {
			tickLog.success(`generated customer: ${JSON.stringify(customer)}`, true);
			tickLog.success(`generated checkoutSession: ${JSON.stringify(checkoutSession)}`, true);
		}
		const customerState = paymentMethodId ? 'A': 'W';
		await runSQL(poolName, sqls.insertCustomer, [applicationCustomerId, customer.id, customerState, customer.email, customer.name, customer.phone, customer.address, JSON.stringify(customer.metadata), checkoutSession?.id, '', JSON.stringify(customer)]);
		return resolve({
			result: 'OK',
			payload: {
				customer,
				checkoutSession
			},
		});
	} catch (error) /* istanbul ignore next */ {
		if (debugMode) tickLog.error(`tamed-stripe-backend related error. Failure while calling generateCustomer(${JSON.stringify(body)}). Error: ${JSON.stringify(error)}`, true);
		return reject(error);
	}
});

const generateCustomerSuccessRoute = (body) => new Promise(async (resolve, reject) => {
	/* istanbul ignore next */
	return resolve(closePage(`<h1>Success!</h1><p>You can close this window now.</p><br>${debugMode ? JSON.stringify(body) : ''}`, 3000));
});

const generateCustomerCancelRoute = (body) => new Promise(async (resolve, reject) => {
	try {
		const session = await stripe.checkout.sessions.retrieve(body.session_id);
		/* istanbul ignore next */
		if (debugMode) tickLog.success(`session: ${JSON.stringify(session)}`, true);
		/* istanbul ignore else  */
		if (session) await runSQL(poolName, sqls.unlinkCustomer, [session.customer], debugMode);
	} catch (error) {
	}
	return resolve(closePage(`<h1>Cancelled!</h1><p>You can close this window now.</p><br>`, 3000));
});

const getCustomer = (body) => new Promise(async (resolve, reject) => {
	try {
		const { applicationCustomerId } = body;
		const customer = await runSQL(poolName, sqls.getCustomer, [applicationCustomerId], debugMode);
		if (customer.rows.length > 0) {
			return resolve({
				result: 'OK',
				payload: customer.rows[0]
			});
		}
		/* istanbul ignore next */ 
		return resolve({
			result: 'NOK',
		});
	} catch (error) /* istanbul ignore next */ {
		if (debugMode) tickLog.error(`tamed-stripe-backend related error. Failure while calling getCustomer(${JSON.stringify(body)}). Error: ${JSON.stringify(error)}`, true);
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
		/* istanbul ignore else */
		if (['day', 'week', 'month', 'year'].includes(interval)) priceData.recurring = { interval };
		const price = await stripe.prices.create(priceData);
		/* istanbul ignore next  */
		if (debugMode) tickLog.success(`generated product: ${JSON.stringify(product)}`, true);
		/* istanbul ignore next */
		if (debugMode) tickLog.success(`generated price: ${JSON.stringify(price)}`, true);
		const insertResult = await runSQL(poolName, sqls.insertProduct, [product.id, name, description, currency, unitAmountDecimal, /* istanbul ignore next */(interval ? interval : ''), JSON.stringify(product), JSON.stringify(price)]);
		/* istanbul ignore next */
		if (debugMode) tickLog.info(`Product insert result: ${JSON.stringify(insertResult)}`, true);
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

// Scenario 2: subscription first and next recurring payments (success & failed)
const generateSubscription = (body) => new Promise(async (resolve, reject) => {
	try {
		const { applicationCustomerId, recurringPriceId, description } = body;
		let customerId;
		const customer = await runSQL(poolName, sqls.getCustomer, [applicationCustomerId], debugMode);
		/* istanbul ignore else */
		if (customer.rows.length > 0) {
			customerId = customer.rows[0].stripe_customer_id;
		} else {
			return reject("No customer found for subscription");
		}
		// check if customer has a subscription witn the same recurringPriceId
		const existingSubscription = await runSQL(poolName, sqls.selectSubscriptionWithProduct, [customerId, recurringPriceId], debugMode);
		/* istanbul ignore else */
		if (existingSubscription.rows.length > 0) {
			return reject("Customer already has a subscription with the same recurringPriceId");
		}
		const subscription = await stripe.subscriptions.create({
			customer: customerId,
			items: [{ price: recurringPriceId }], // for subscriptions, we assume there is only one item
			description: description,
		});
		/* istanbul ignore next */
		if (debugMode) tickLog.success(`generated subscription: ${JSON.stringify(subscription)}`, true);
		// stripe_subscription_id, stripe_customer_id, stripe_product_id, description, currency, 
		// unit_amount_decimal, interval, update_time, subscription_object
		await runSQL(poolName, sqls.insertSubscription, [
			subscription.id,
			customerId,
			subscription.items.data[0].price.product,  // we assume there is only one item for subscriptions
			subscription.description,
			subscription.currency,
			subscription.items.data[0].price.unit_amount_decimal, // we assume there is only one item for subscriptions
			subscription.items.data[0].price.recurring.interval, // we assume there is only one item for subscriptions
			JSON.stringify(subscription)
		], debugMode);
		return resolve({
			result: 'OK',
			payload: subscription,
		});
	} catch (error) /* istanbul ignore next */ {
		return reject(error);
	}
});

/* istanbul ignore next */
const getSubscriptionPaymentsByStripeCustomerId = (body) => new Promise(async (resolve, reject) => {
	try {
		const { customerId } = body;
		const result = await runSQL(poolName, sqls.selectSubscriptionPaymentsByStripeCustomerId, [customerId], debugMode);
		return resolve({
			result: 'OK',
			payload: result.rows,
		});
	} catch (error) /* istanbul ignore next */ {
		return reject(error);
	}
});

const getSubscriptionPayments = (body) => new Promise(async (resolve, reject) => {
	try {
		const { applicationCustomerId } = body;
		// find stripe customer id from application customer id
		const customer = await runSQL(poolName, sqls.getCustomer, [applicationCustomerId], debugMode);
		/* istanbul ignore else */
		if (customer.rows.length === 0) {
			return reject("No customer found for subscription");
		}
		const customerId = customer.rows[0].stripe_customer_id;
		const result = await runSQL(poolName, sqls.selectSubscriptionPaymentsByStripeCustomerId, [customerId], debugMode);
		return resolve({
			result: 'OK',
			payload: result.rows,
		});
	} catch (error) /* istanbul ignore next */ {
		return reject(error);
	}
});

// Scenario 2: cancel subscription
const cancelSubscription = (body) => new Promise(async (resolve, reject) => {
	try {
		let { subscriptionId } = body;
		const subscription = await stripe.subscriptions.cancel(subscriptionId);
		/* istanbul ignore next */
		if (debugMode) tickLog.success(`cancelled subscription: ${JSON.stringify(subscription)}`, true);
		await runSQL(poolName, sqls.updateSubscription, [subscriptionId], debugMode);
		return resolve({
			result: 'OK',
			payload: subscription,
		});
	} catch (error) /* istanbul ignore next */ {
		return reject(error);
	}
});

const convertItems = (currency, items) => {
	const retVal = [];
	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		retVal.push({
			price_data: { currency, currency, product_data: { name: item.name, }, unit_amount_decimal: item.unitAmountDecimal, },
			quantity: 1,
		});
	}
	return retVal;
}

const generateAccount = (body) => new Promise(async (resolve, reject) => {
	let { applicationCustomerId, email, publicDomain, refreshUrlRoute, returnUrlRoute, country, capabilities } = body;
	let refreshUrl = `${publicDomain}${refreshUrlRoute || '/generate-account-cancel-route'}`;
	let returnUrl = `${publicDomain}${returnUrlRoute || '/generate-account-success-route'}`

	try {
		let result = await runSQL(poolName, sqls.selectAccount, [applicationCustomerId]);
		// Already exists an Active account for this applicationCustomerId so return only it
		if ((result.rows.length > 0) && (result.rows[0].state === 'A')) {
			return resolve({
				result: 'OK',
				payload: {
					id: result.rows[0].stripe_account_id,
					accountLinkURL: ''
				}
			});
		}

		// There is an account id but Waiting to be finalized so generate a new link for the same account id
		if ((result.rows.length > 0) && (result.rows[0].state === 'W')) {
			const accountLinkForW = await stripe.accountLinks.create({
				account: result.rows[0].stripe_account_id,
				refresh_url: refreshUrl,
				return_url: returnUrl,
				type: 'account_onboarding'
			});
			return resolve({
				result: 'OK',
				payload: {
					id: result.rows[0].stripe_account_id,
					accountLinkURL: accountLinkForW.url,
					urlRegenerated: true
				}
			});
		}

		// There is no account, so generate the account and the link
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
		const accountLink = await stripe.accountLinks.create({
			account: account.id,
			refresh_url: refreshUrl,
			return_url: returnUrl,
			type: 'account_onboarding'
		});
		account.accountLinkURL = accountLink.url;
		/* istanbul ignore next */
		if (debugMode) tickLog.success(`generated accountLink.url: ${accountLink.url}`, true);

		let result3 = await runSQL(poolName, sqls.insertConnectedAccount, [applicationCustomerId, account.id, 'W', JSON.stringify(account.capabilities), account.email, JSON.stringify(account.settings.payouts.schedule), JSON.stringify(account)]);
		return resolve({
			result: 'OK',
			payload: account,
		});
	} catch (error) /* istanbul ignore next */ {
		if (debugMode) tickLog.error(`tamed-stripe-backend related error. Failure while calling generateAccount(${JSON.stringify(body)}). Error: ${JSON.stringify(error)}`, true);
		return reject(error);
	}
});

const generateAccountSuccessRoute = (body) => new Promise(async (resolve, reject) => {
	/* istanbul ignore next */
	return resolve(closePage(`<h1>Success!</h1><p>Account generation completed.</p><br>${debugMode ? JSON.stringify(body) : ''}`, 3000));
});

const generateAccountCancelRoute = (body) => new Promise(async (resolve, reject) => {
	/* istanbul ignore next */
	return resolve(closePage(`<h1>FAIL!</h1><p>Account generation failed, please try again later.</p><br>${debugMode ? JSON.stringify(body) : ''}`, 3000));
});

const getAccount = (body) => new Promise(async (resolve, reject) => {
	try {
		const { applicationCustomerId } = body;
		const result = await runSQL(poolName, sqls.getAccount, [applicationCustomerId], debugMode);
		if (result.rows.length > 0) {
			return resolve({
				result: 'OK',
				payload: result.rows[0]
			});
		}
		/* istanbul ignore next */ 
		return resolve({
			result: 'NOK',
		});
	} catch (error) /* istanbul ignore next */ {
		if (debugMode) tickLog.error(`tamed-stripe-backend related error. Failure while calling getAccount(${JSON.stringify(body)}). Error: ${JSON.stringify(error)}`, true);
		return reject(error);
	}
});

const getItemsTotalPrice = (items) => {
	let totalPrice = 0;
	for (let i = 0; i < items.length; i++) {
		totalPrice += Number(items[i].unitAmountDecimal);
	}
	return totalPrice;
}

const oneTimePayment = (body) => new Promise(async (resolve, reject) => {
	try {
		// payoutData: {payoutAmount, payoutAccountId}
		// items: [{name, unitAmountDecimal}]
		const { applicationCustomerId, customerId, currency, items, payoutData, publicDomain, } = body;
		const successRoute = body?.successRoute || '/one-time-payment-success-route';
		const cancelRoute = body?.cancelRoute || '/one-time-payment-cancel-route';

		// In case there is payout
		// convert payoutData to payment intent structure
		let paymentIntentParams = undefined;
		if (payoutData) {
			paymentIntentParams = {
				transfer_data: {
					amount: payoutData.payoutAmount,
					destination: payoutData.payoutAccountId,
				}
			};
		}

		const stripeItems = convertItems(currency, items);

		const successUrl = `${publicDomain}${successRoute}?session_id={CHECKOUT_SESSION_ID}`;
		const cancelUrl = `${publicDomain}${cancelRoute}?session_id={CHECKOUT_SESSION_ID}`;

		const checkoutSessionParams = {
			mode: 'payment',
			customer: customerId,
			currency: currency,
			line_items: stripeItems,
			invoice_creation: { enabled: true },
			payment_intent_data: paymentIntentParams,
			success_url: successUrl,
			cancel_url: cancelUrl,
		};
		const checkoutSession = await stripe.checkout.sessions.create(checkoutSessionParams);
		/* istanbul ignore next */
		if (debugMode) tickLog.success(`generated checkoutSession: ${JSON.stringify(checkoutSession)}`, true);
		let totalAmount = getItemsTotalPrice(items);
		// application_customer_id, stripe_customer_id, update_time, total_amount_decimal, currency, state, invoice_id, hosted_invoice_url, payout_amount, payout_account_id, payout_state, items, one_time_payment_object
		let result = await runSQL(poolName, sqls.insertOneTimePayment, [applicationCustomerId, customerId, checkoutSession.id, totalAmount, currency, 'W', payoutData ? payoutData.payoutAmount : null, payoutData ? payoutData.payoutAccountId : null, payoutData ? 'W' : null, JSON.stringify(items), JSON.stringify(checkoutSession)]);
		return resolve({
			result: 'OK',
			payload: checkoutSession,
		});
	} catch (error) /* istanbul ignore next */ {
		if (debugMode) tickLog.error(`tamed-stripe-backend related error. Failure while calling oneTimePayment(${JSON.stringify(body)}). Error: ${JSON.stringify(error)}`, true);
		return reject(error);

	}

});

const oneTimePaymentSuccessRoute = (body) => new Promise(async (resolve, reject) => {
	/* istanbul ignore next */
	return resolve(closePage(`<h1>Success!</h1><p>Checkout completed.</p><br>${debugMode ? JSON.stringify(body) : ''}`, 3000));
});

const oneTimePaymentCancelRoute = (body) => new Promise(async (resolve, reject) => {
	/* istanbul ignore next */
	return resolve(closePage(`<h1>FAIL!</h1><p>Checkout failed, please try again later.</p><br>${debugMode ? JSON.stringify(body) : ''}`, 3000));
});

/* istanbul ignore next */
const getOneTimePaymentStatus = (body) => new Promise(async (resolve, reject) => {
	const { checkoutSessionId } = body;
	try {
		const oneTimePayment = await runSQL(poolName, sqls.selectOneTimePayment, [checkoutSessionId], debugMode);
		/* istanbul ignore next */
		if (debugMode) tickLog.success(`retrieved oneTimePayment: ${JSON.stringify(oneTimePayment)}`, true);
		return resolve({
			result: 'OK',
			payload: oneTimePayment,
		});
	} catch (error) /* istanbul ignore next */ {

	}
});

// Scenario 1: Customer registration & card payment method setup save (failed)
const webhookCheckoutSessionFailedSetup = (props) => new Promise(async (resolve, reject) => {
	let session;
	try {
		const { checkoutSessionId } = props;
		session = await stripe.checkout.sessions.retrieve(checkoutSessionId);
		/* istanbul ignore else */
		if (session) await runSQL(poolName, sqls.unlinkCustomer, [session.customer], debugMode);
	} catch (error) /* istanbul ignore next */ {
		// Do nothing
	}
	return resolve();
});

// Scenario 1: Customer registration & card payment method setup save (success)
// MODIFYME In future try to find a method to add this to the coverage tests
/* istanbul ignore next */
const webhookCheckoutSessionCompletedSetup = (props) => new Promise(async (resolve, reject) => {
	const { checkoutSessionId } = props;
	let session;
	try {
		session = await stripe.checkout.sessions.retrieve(checkoutSessionId);
		if (debugMode) tickLog.success(`session: ${JSON.stringify(session)}`, true);
		const setupIntent = await stripe.setupIntents.retrieve(session.setup_intent);
		if (debugMode) tickLog.success(`setupIntent: ${JSON.stringify(setupIntent)}`, true);
		if (!(setupIntent?.payment_method)) throw new Error('No payment method found');
		const paymentMethod = await stripe.paymentMethods.attach(
			setupIntent.payment_method,
			{ customer: session.customer }
		);
		if (debugMode) tickLog.success(`paymentMethod:\n${JSON.stringify(paymentMethod)}`, true);
		const customer = await stripe.customers.update(session.customer, {
			invoice_settings: {
				default_payment_method: setupIntent.payment_method
			}
		});
		tickLog.success(`Customer Generated:\n${JSON.stringify(customer, null, 2)}`, true);
		const modifyResult = await runSQL(poolName, sqls.modifyCustomerPayment, [session.customer, 'A', setupIntent.payment_method], debugMode);
	} catch (error) /*istanbul ignore next*/ {
		// only log error and keep the customer in W state which is just a useless state.
		if (debugMode) tickLog.error(`\x1b[0;31mwebhookCheckoutSessionCompletedSetup failed\x1b[0m for checkoutSessionId ${checkoutSessionId} with error ${JSON.stringify(error)}`, true);
		try {
			if (session) await runSQL(poolName, sqls.unlinkCustomer, [session.customer], debugMode);
		} catch (error2) {
			// Do nothing
		}
	}
	return resolve();
});

// Scenario 2: subscription first and next recurring payments (success & failed)
const webhookSubscriptionInvoicePaid = (event) => new Promise(async (resolve, reject) => {
	try {
		const invoice = event.data.object;
		// subscription invoice should have only 1 line
		const periodStart = new Date(invoice.lines.data[0].period.start * 1000);
		const periodEnd = new Date(invoice.lines.data[0].period.end * 1000);
		// stripe_subscription_id, invoice_id, hosted_invoice_url, insert_time, unit_amount_decimal, currency, state, subscription_covered_from, subscription_covered_to, subscription_payment_object
		await runSQL(poolName, sqls.insertSubscriptionPayment, [invoice.subscription, invoice.id, invoice.hosted_invoice_url, `${invoice.amount_paid}`, invoice.currency, /* istanbul ignore next */ (invoice.status === 'paid') ? 'P' : 'F', periodStart, periodEnd, event], debugMode);
		return resolve({
			result: 'OK',
			payload: undefined,
		});
	} catch (error) {
		/*istanbul ignore next*/
		return reject(error);
	}
});

// Scenario 3 & 4: One-time payment with or without payout
const webhookCheckoutSessionCompletedPayment = (event) => new Promise(async (resolve, reject) => {
	const invoice = await stripe.invoices.retrieve(event.data.object.invoice);
	/* istanbul ignore next */
	if (debugMode) tickLog.success(`invoice: ${JSON.stringify(invoice)}`, true);
	const checkoutSessionId = event.data.object.id;
	// state = $2, invoice_id = $3, hosted_invoice_url = $4 where checkout_session_id = $1
	const result = await runSQL(poolName, sqls.updateOneTimePayment, [checkoutSessionId, 'P', invoice.id, invoice.hosted_invoice_url], debugMode);
	return resolve();
});

// Scenario 4: One-time payment with payout, account generation
// MODIFYME In future try to find a method to add this to the coverage tests
/* istanbul ignore next */
const webhookAccountUpdated = (event) => new Promise(async (resolve, reject) => {
	try {
		if (event.data.object.charges_enabled && event.data.object.payouts_enabled) {
			const result = await runSQL(poolName, sqls.updateConnectedAccount, [event.data.object.id, 'A'], debugMode);
		}
		return resolve();
	} catch (error) {
		return reject(error);
	}
});


/* istanbul ignore next */
const webhook = (body) => new Promise(async (resolve, reject) => {
	try {
		let event = body;
		tickLog.info(`Webhook received: ${JSON.stringify(event)}`, true);
		switch (event.type) {
			case 'checkout.session.completed':
				// Scenario 1: Customer registration & card payment method setup save (success)
				if (event.data.object.mode === 'setup') {
					await webhookCheckoutSessionCompletedSetup({ checkoutSessionId: event.data.object.id });
				};
				if ((event.data.object.mode === 'payment') && (event.data.object.status === 'complete')) {
					await webhookCheckoutSessionCompletedPayment(event);
				};
				break;
			case 'checkout.session.async_payment_succeeded':
				// Scenario 1: Customer registration & card payment method setup save (success)
				if (event.data.object.mode === 'setup') {
					await webhookCheckoutSessionCompletedSetup({ checkoutSessionId: event.data.object.id });
				}
				if ((event.data.object.mode === 'payment') && (event.data.object.status === 'complete')) {
					await webhookCheckoutSessionCompletedPayment(event);
				};
				break;
			case 'checkout.session.async_payment_failed':
				// Scenario 1: Customer registration & card payment method setup save (failed)
				if (event.data.object.mode === 'setup') {
					await webhookCheckoutSessionFailedSetup({ checkoutSessionId: event.data.object.id });
				};
				break;
			case 'checkout.session.expired':
				// Scenario 1: Customer registration & card payment method setup save (failed)
				if (event.data.object.mode === 'setup') {
					await webhookCheckoutSessionFailedSetup({ checkoutSessionId: event.data.object.id });
				}
				break;
			case 'invoice.paid':
				if ((event.data.object.billing_reason.match(/subscription_/)) && (event.data.object.status === 'paid')) {
					await webhookSubscriptionInvoicePaid(event); // Scenario 2: subscription first and next recurring payments (success & failed)
				};
				break;
			case 'account.updated':
				webhookAccountUpdated(event); // Scenario 4: One-time payment with payout, account generation
				break;
			default:
				break;
		}

		return resolve({
			result: 'OK',
			payload: undefined,
		});
	} catch (error) {
		// Don't reject so that webhook continue working but log the error
		tickLog.error(`\x1b[0;31mWebhook failed\x1b[0m with error ${JSON.stringify(error)} for ${JSON.stringify(body)}`, true);
	}
});

module.exports = {
	init,
	webViewClose,
	generateCustomer,
	generateCustomerSuccessRoute,
	generateCustomerCancelRoute,
	getCustomer,
	generateSubscription,
	getSubscriptionPayments,
	cancelSubscription,
	generateProduct,
	generateAccount,
	generateAccountSuccessRoute,
	generateAccountCancelRoute,
	getAccount,
	oneTimePayment,
	oneTimePaymentSuccessRoute,
	oneTimePaymentCancelRoute,
	getOneTimePaymentStatus,
	webhook,
	exportedForTesting: {
		poolInfoForTests: poolInfoForTests,
		getSubscriptionPaymentsByStripeCustomerId,
	}
}


