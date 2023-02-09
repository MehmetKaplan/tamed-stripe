const sqls = require('./sqls.json');
const uiTexts = require('./ui-texts-english.json');
const stripeSK = require('./config.js').secretKey;
const stripePK = require('./config.js').publishableKey;
// const stripe = require('stripe')(stripeSK);
const stripe = require('stripe')('sk_test_51MVglyCDKfcpGwAfWlYSKHZnjZrERjGeHvWJn5LjjgKOyWTZZCsfG4bgtclIJjxGIFdfHMqdO2VVgCVXK1iEyr5E00Qz97PQNH'); // deleteme

const { connect, runSQL } = require('tamed-pg');
const tickLog = require('tick-log');
const { truncate } = require('fs');

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

const generateAccount = (props) => new Promise(async (resolve, reject) => {
	let { email, description, payoutAccount } = props;
	try {
		delete props.payoutAccount;
		const accountGenerationParams = {
			email: email,
			description: description,
			type: 'express',
			capabilities: {
				card_payments: { requested: true },
			},
			settings: {
				payouts: {
					schedule: {
						delay_days: 'minimum'
					}
				}
			}
		};
		if (payoutAccount) accountGenerationParams.capabilities.transfers = { requested: true };

		const account = await stripe.accounts.create(accountGenerationParams);
		if (debugMode) tickLog.success(`generated account: ${JSON.stringify(account)}`, true);

		return resolve({
			result: 'OK',
			payload: account,
		});
	} catch (error) {
		if (debugMode) tickLog.error(`tamed-stripe-backend related error. Failure while calling generateAccount(${JSON.stringify(props)}). Error: ${JSON.stringify(error)}`, true);
		return reject(error);
	}
});

const paymentSheetHandler = (props) => new Promise(async (resolve, reject) => {
	try {
		let { customerId, payInAmount, currency, transferData, payoutData } = props;
		if (payoutData) transferData = {
			amount: payoutData.payoutAmount,
			destination: payoutData.payoutCustomerId,
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
			// { apiVersion: '2022-11-15' } // Do we need to provide an API version?
		);
		const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

		return resolve({
			result: 'OK',
			payload: {
				paymentIntent: paymentIntent.client_secret,
				ephemeralKey: ephemeralKey.secret,
				customer: customerId,
				publishableKey: stripePK
			},
		});
	} catch (error) {
		return reject(error);
	}
});


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
	generateAccount, paymentSheetHandler, refundHandler
}