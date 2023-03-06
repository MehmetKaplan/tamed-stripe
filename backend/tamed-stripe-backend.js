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
		let { description, email, metadata, name, phone, address, publicDomain, successRoute, cancelRoute } = body;
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
		await runSQL(poolName, sqls.insertCustomer, [customer.id, 'W', customer.email, customer.name, customer.phone, customer.address, JSON.stringify(customer.metadata), checkoutSession.id, '', JSON.stringify(customer)]);
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
	try {
		const session = await stripe.checkout.sessions.retrieve(body.session_id);
		if (debugMode) tickLog.success(`session: ${JSON.stringify(session)}`, true);
		const setupIntent = await stripe.setupIntents.retrieve(session.setup_intent);
		if (debugMode) tickLog.success(`setupIntent: ${JSON.stringify(setupIntent)}`, true);
		const modifyResult = await runSQL(poolName, sqls.modifyCustomerPayment, [session.customer, 'A', setupIntent.payment_method], debugMode);
		return resolve(closePage(`<h1>Success!</h1><p>You can close this window now.</p><br>${JSON.stringify(body)}`, 3000));
	}
	catch (error) /* istanbul ignore next */ {
		if (debugMode) tickLog.error(`tamed-stripe-backend related error. Failure while calling generateCustomerSuccessRoute(${JSON.stringify(body)}). Error: ${JSON.stringify(error)}`, true);
		return resolve(closePage(`<h1>Error!</h1><p>Please try again later.</p><br>${JSON.stringify(body)}`, 3000));		
	}

});

const generateCustomerCancelRoute = (body) => new Promise(async (resolve, reject) => {
	return resolve(closePage(`<h1>Cancelled!</h1><p>You can close this window now.</p><br>${JSON.stringify(body)}`, 3000));
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
	webViewClose,
	generateCustomer,
	generateCustomerSuccessRoute,
	generateCustomerCancelRoute,
	generateProduct,
	webhook,
	exportedForTesting: {
		poolInfoForTests: poolInfoForTests,
	}
}


