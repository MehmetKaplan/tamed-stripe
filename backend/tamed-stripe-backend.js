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
		uiTexts.applicationName = p_params?.applicationName ? p_params?.applicationName : uiTexts.applicationName;
		return resolve(true);
	} catch (error) /* istanbul ignore next */ {
		tickLog.error(`Function init failed. Error: ${JSON.stringify(error)}`, true);
		return reject(uiTexts.unknownError);
	}
});

const generateCustomer = (props) => new Promise(async (resolve, reject) => {
	try {
		let { description, email, metadata, name, phone, address } = props;
		let lowCaseEmail = email.toLowerCase().trim();
		const customer = await stripe.customers.create({ description, email: lowCaseEmail, metadata, name, phone, address });
		if (debugMode) tickLog.success(`generated customer: ${JSON.stringify(customer)}`, true);
		let countResult = await runSQL(poolName, sqls.customerExists, [customer.id]);
		if (debugMode) tickLog.info(`Database select result: ${JSON.stringify(countResult)}`, true);
		if (parseInt(countResult.rows[0].count) === 0) {
			// insert
			// (stripe_customer_id, email, name, phone, address, metadata, customer_object) 
			let insertResult = await runSQL(poolName, sqls.insertCustomer, [customer.id, customer.email, customer.name, customer.phone, customer.address, JSON.stringify(customer.metadata), JSON.stringify(customer)]);
			if (debugMode) tickLog.info(`Database insert result: ${JSON.stringify(insertResult)}`, true);
		} else /* istanbul ignore next */ {
			// can not come here
			// placed just to satisfy istanbul
		};
		return resolve({
			result: 'OK',
			payload: customer,
		});
	} catch (error) /* istanbul ignore next */ {
		if (debugMode) tickLog.error(`tamed-stripe-backend related error. Failure while calling generateCustomer(${JSON.stringify(props)}). Error: ${JSON.stringify(error)}`, true);
		return reject(error);
	}
});

const generateAccount = (props) => new Promise(async (resolve, reject) => {
	let { email } = props;
	try {
		const accountGenerationParams = {
			type: 'express',
			email: email,
			capabilities: {
				card_payments: { requested: true },
				transfers: { requested: true }
			},
			settings: {
				payouts: {
					schedule: {
						delay_days: 'minimum'
					}
				}
			}
		};
		const account = await stripe.accounts.create(accountGenerationParams);
		if (debugMode) tickLog.success(`generated account: ${JSON.stringify(account)}`, true);
		let countResult = await runSQL(poolName, sqls.connectedAccountsExists, [account.id]);
		if (debugMode) tickLog.info(`Database select result: ${JSON.stringify(countResult)}`, true);
		if (parseInt(countResult.rows[0].count) === 0) {
			// insert
			// (stripe_customer_id, email, name, phone, address, metadata, customer_object) 
			let insertResult = await runSQL(poolName, sqls.insertConnectedAccount, [account.id, JSON.stringify(account.capabilities), account.email, JSON.stringify(account.settings.payouts.schedule), JSON.stringify(account)]);
			if (debugMode) tickLog.info(`Database insert result: ${JSON.stringify(insertResult)}`, true);
		} else /* istanbul ignore next */ {
			// can not come here
			// placed just to satisfy istanbul
		};		
		return resolve({
			result: 'OK',
			payload: account,
		});
	} catch (error) /* istanbul ignore next */ {
		if (debugMode) tickLog.error(`tamed-stripe-backend related error. Failure while calling generateAccount(${JSON.stringify(props)}). Error: ${JSON.stringify(error)}`, true);
		return reject(error);
	}
});


// USED both for normal payments and payouts
const paymentSheetHandler = (props) => new Promise(async (resolve, reject) => {
	try {
		let { customerId, payInAmount, currency, payoutData } = props;
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
		if (transferData) paymentIntentParams.transfer_data = transferData;
		const ephemeralKey = await stripe.ephemeralKeys.create(
			{ customer: customerId },
			{ apiVersion: '2022-11-15' }
		);
		const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
		if (debugMode) tickLog.success(`generated ephemeralKey: ${JSON.stringify(ephemeralKey)}`, true);
		if (debugMode) tickLog.success(`generated paymentIntent: ${JSON.stringify(paymentIntent)}`, true);
		let insertResult = await runSQL(poolName, sqls.insertPaymentSheet, [customerId, payInAmount, currency, payoutData?.destination /*account id*/, payoutData?.amount, ephemeralKey.secret]);
		if (debugMode) tickLog.info(`Database insert result: ${JSON.stringify(insertResult)}`, true);
		return resolve({
			result: 'OK',
			payload: {
				paymentIntent: paymentIntent.client_secret,
				ephemeralKey: ephemeralKey.secret,
				customer: customerId,
				publishableKey: stripePK
			},
		});
	} catch (error) /* istanbul ignore next */{
		return reject(error);
	}
});

// MODIFYME to be handled after frontend is ready
const refundHandler = (props) => new Promise(async (resolve, reject) => {
	try {
		// refund, can be done only for the last transaction
		let { chargeId } = props;
		const refund = await stripe.refunds.create({
			charge: chargeId,
			reverse_transfer: true,
		});
		return resolve({
			result: 'OK',
			payload: refund,
		});
	} catch (error) {
		return reject(error);
	}
});

module.exports = {
	init,
	generateAccount,
	generateCustomer,
	paymentSheetHandler,
	refundHandler
}