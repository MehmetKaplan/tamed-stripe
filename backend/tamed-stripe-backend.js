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

const closePage = (content, duration) => {
	return `
		<html>
			<script>setTimeout(function() {window.location='web-view-close'}, ${duration});</script>
			<body style:{width:80%;	margin-left:auto;	margin-right:auto;}>${content}</body>
		</html>
	`.replace(/\t/g, '').replace(/\n/g, '').replace(/\s\s+/g, ' ');
};

const webViewClose = (body) => new Promise(async (resolve, reject) => {
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
		let { applicationCustomerId, description, email, metadata, name, phone, address, publicDomain, successRoute, cancelRoute } = body;
		// {CHECKOUT_SESSION_ID} is to be used by Stripe, DON'T modify it!
		let successUrl = `${publicDomain}${successRoute}?session_id={CHECKOUT_SESSION_ID}`;
		let cancelUrl = `${publicDomain}${cancelRoute}?session_id={CHECKOUT_SESSION_ID}`;

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
			payment_method_types: ['card'], // MODIFYME try by removing this line
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
		await runSQL(poolName, sqls.insertCustomer, [applicationCustomerId, customer.id, 'W', customer.email, customer.name, customer.phone, customer.address, JSON.stringify(customer.metadata), checkoutSession.id, '', JSON.stringify(customer)]);
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
	return resolve(closePage(`<h1>Success!</h1><p>You can close this window now.</p><br>${debugMode ? JSON.stringify(body) : ''}`, 3000));
});

const generateCustomerCancelRoute = (body) => new Promise(async (resolve, reject) => {
	const session = await stripe.checkout.sessions.retrieve(body.session_id);
	if (debugMode) tickLog.success(`session: ${JSON.stringify(session)}`, true);
	const modifyResult = await runSQL(poolName, sqls.modifyCustomerPayment, [session.customer, 'C', ''], debugMode);
	return resolve(closePage(`<h1>Cancelled!</h1><p>You can close this window now.</p><br>`, 3000));
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

const oneTimePayment = (body) => new Promise(async (resolve, reject) => {
	try {
		// payoutData: {payoutAmount, payoutAccountId, useOnBehalfOf: true|false}
		// items: [{name, unitAmountDecimal}]
		const { customerId, currency, items, payoutData, publicDomain, successRoute, cancelRoute } = body;

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
			// if (payoutData?.useOnBehalfOf) paymentIntentParams.on_behalf_of = payoutData.payoutAccountId;
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

		return resolve({
			result: 'OK',
			payload: checkoutSession,
		});
	} catch (error) {
		if (debugMode) tickLog.error(`tamed-stripe-backend related error. Failure while calling oneTimePayment(${JSON.stringify(body)}). Error: ${JSON.stringify(error)}`, true);
		return reject(error);

	}

});

const webhookCheckoutSessionCompleted = (props) => new Promise(async (resolve, reject) => {
	let session;
	try {
		const {checkoutSessionId} = props;
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
	} catch (error) {
		// only log error and keep the customer in W state which is just a useless state.
		if (debugMode) tickLog.error(`\x1b[0;31mwebhookCheckoutSessionCompleted failed\x1b[0m for checkoutSessionId ${checkoutSessionId} with error ${JSON.stringify(error)}`, true);
		try {
			if (session) await runSQL(poolName, sqls.modifyCustomerPayment, [session.customer], debugMode);
		} catch (error2) {
			// Do nothing
		}
	}
});

/* istanbul ignore next */
const webhook = (body) => new Promise(async (resolve, reject) => {
	try {
		let event = body;
		tickLog.info(`Webhook received: ${JSON.stringify(event)}`, true);
		switch (event.type) {
			case 'checkout.session.completed':
				// Webhook Scenario 1: Customer registration & card payment method save
				if (event.data.object.mode === 'setup') {
					await webhookCheckoutSessionCompleted({checkoutSessionId: event.data.object.id});
				}
				break;
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
	webViewClose,
	generateCustomer,
	generateCustomerSuccessRoute,
	generateCustomerCancelRoute,
	generateSubscription,
	generateProduct,
	generateAccount,
	oneTimePayment,
	webhook,
	exportedForTesting: {
		poolInfoForTests: poolInfoForTests,
	}
}


