const fetchLean = require('fetch-lean');

let apiBackend, routes, debugMode;
const init = async (props) => {
	debugMode = props.debugMode;
	/* istanbul ignore next */
	if (debugMode) console.log(`\x1b[1;33m;API Backend: ${props.apiBackend}\x1b[0m`);
	/* istanbul ignore next */
	if (debugMode) console.log(`\x1b[1;33mTo be used routes: ${JSON.stringify(props.routes, null, 2)}\x1b[0m`);
	apiBackend = props.apiBackend;
	routes = props.routes;
};

const backendCaller = (method, route, headers, props, successCallback, failCallback, absoluteURI = false) => new Promise(async (resolve, reject) => {
	let result;
	/* istanbul ignore next */
	let l_url = `${absoluteURI ? '' : apiBackend}${route}`;
	/* istanbul ignore next */
	if (debugMode) console.log(`Calling backend: ${l_url}\nparameters:\n${JSON.stringify(props, null, '\t')}`);
	result = await fetchLean(method, l_url, headers, props, true);
	/* istanbul ignore else */
	if (result.status === 200) {
		/* istanbul ignore next */
		if (debugMode) console.log(`\x1b[0;32mBackend call success:\x1b[0m ${JSON.stringify(result, null, '\t')}`);
		/* istanbul ignore next */
		if (successCallback) successCallback(props, result);
		return resolve(result);
	}
	else {
		if (debugMode) console.log(`\x1b[0;31mBackend call fail:\x1b[0m ${JSON.stringify(result)}`);
		if (failCallback) failCallback(props, result);
		return reject(result);
	}
});

const generateCustomer = (props) => new Promise(async (resolve, reject) => {
	try {
		const header = props?.header ? props.header : {};
		const body = {};
		body.applicationCustomerId = props.applicationCustomerId;
		body.description = props.description;
		body.email = props.email;
		body.metadata = props.metadata;
		body.name = props.name;
		body.phone = props.phone;
		body.address = props.address;
		body.publicDomain = props.publicDomain;
		body.successRoute = props?.successRoute;
		body.cancelRoute = props?.cancelRoute;

		const response = await backendCaller('POST', routes.generateCustomer, header, body);
		return resolve(response);
	} catch (error) /* istanbul ignore next */ {
		if (debugMode) console.log(`\x1b[0;31mError: ${JSON.stringify(error)}\x1b[0m`);
		return reject(error);
	}
});

const getCustomer = (props) => new Promise(async (resolve, reject) => {
	try {
		const header = props?.header ? props.header : {};
		const body = {};
		body.applicationCustomerId = props.applicationCustomerId;
		const response = await backendCaller('POST', routes.getCustomer, header, body);
		return resolve(response);
	} catch (error) /* istanbul ignore next */ {
		if (debugMode) console.log(`\x1b[0;31mError: ${JSON.stringify(error)}\x1b[0m`);
		return reject(error);
	}
});

const generateProduct = (props) => new Promise(async (resolve, reject) => {
	try {
		const header = props?.header ? props.header : {};
		const body = {
			name: props.name,
			description: props.description,
			currency: props.currency,
			unitAmountDecimal: props.unitAmountDecimal,
			interval: props.interval,
		};
		const response = await backendCaller('POST', routes.generateProduct, header, body);
		return resolve(response);
	} catch (error) /* istanbul ignore next */ {
		if (debugMode) console.log(`\x1b[0;31mError: ${JSON.stringify(error)}\x1b[0m`);
		return reject(error);
	}
});

const generateSubscription = (props) => new Promise(async (resolve, reject) => {
	try {
		const header = props?.header ? props.header : {};
		const body = {
			customerId: props.customerId,
			recurringPriceId: props.recurringPriceId,
			description: props.description,
		};
		const response = await backendCaller('POST', routes.generateSubscription, header, body);
		return resolve(response);
	} catch (error) /* istanbul ignore next */ {
		if (debugMode) console.log(`\x1b[0;31mError: ${JSON.stringify(error)}\x1b[0m`);
		return reject(error);
	}
});


const generateAccount = (props) => new Promise(async (resolve, reject) => {
	try {
		const header = props?.header ? props.header : {};
		const body = {};
		body.applicationCustomerId = props.applicationCustomerId;
		body.email = props.email;
		body.publicDomain = props.publicDomain;
		body.country = props.country;

		body.refreshUrlRoute = props?.refreshUrlRoute;
		body.returnUrlRoute = props?.returnUrlRoute;

		const response = await backendCaller('POST', routes.generateAccount, header, body);
		return resolve(response);
	} catch (error) /* istanbul ignore next */ {
		if (debugMode) console.log(`\x1b[0;31mError: ${JSON.stringify(error)}\x1b[0m`);
		return reject(error);
	}
});

const getAccount = (props) => new Promise(async (resolve, reject) => {
	try {
		const header = props?.header ? props.header : {};
		const body = {};
		body.applicationCustomerId = props.applicationCustomerId;
		const response = await backendCaller('POST', routes.getAccount, header, body);
		return resolve(response);
	} catch (error) /* istanbul ignore next */ {
		if (debugMode) console.log(`\x1b[0;31mError: ${JSON.stringify(error)}\x1b[0m`);
		return reject(error);
	}
});


const oneTimePayment = (props) => new Promise(async (resolve, reject) => {
	try {
		// payoutData: {payoutAmount, payoutAccountId}
		// items: [{name, unitAmountDecimal}]
		// applicationCustomerId, customerId, currency, items, payoutData, publicDomain,
		const header = props?.header ? props.header : {};
		const body = {};
		body.applicationCustomerId = props.applicationCustomerId;
		body.customerId = props.customerId;
		body.currency = props.currency;
		body.items = props.items;
		body.payoutData = props.payoutData;
		body.publicDomain = props.publicDomain;

		body.successRoute = props?.successRoute;
		body.cancelRoute = props?.cancelRoute;

		const response = await backendCaller('POST', routes.oneTimePayment, header, body);
		return resolve(response);
	} catch (error) /* istanbul ignore next */ {
		if (debugMode) console.log(`\x1b[0;31mError: ${JSON.stringify(error)}\x1b[0m`);
		return reject(error);
	}
});

const getSubscriptionPaymentsByStripeCustomerId = (props) => new Promise(async (resolve, reject) => {
	try {
		const header = props?.header ? props.header : {}; 
		const body = {
			customerId: props.customerId,
		};
		const response = backendCaller('POST', routes.getSubscriptionPaymentsByStripeCustomerId, header, body);
		return resolve(response);
	} catch (error) /* istanbul ignore next */ {
		if (debugMode) console.log(`\x1b[0;31mError: ${JSON.stringify(error)}\x1b[0m`);
		return reject(error);
	}
});

const getOneTimePaymentStatus = (props) => new Promise(async (resolve, reject) => {
	try {
		const header = props?.header ? props.header : {}; 
		const body = {
			checkoutSessionId: props.checkoutSessionId,
		};
		const response = backendCaller('POST', routes.getOneTimePaymentStatus, header, body);
		return resolve(response);
	} catch (error) /* istanbul ignore next */ {
		if (debugMode) console.log(`\x1b[0;31mError: ${JSON.stringify(error)}\x1b[0m`);
		return reject(error);
	}
});


module.exports = {
	init,
	generateCustomer,
	getCustomer,
	generateProduct,
	generateSubscription,
	generateAccount,
	getAccount,
	oneTimePayment,
	getOneTimePaymentStatus,
	exportedForTesting: {
		getSubscriptionPaymentsByStripeCustomerId
	}
};