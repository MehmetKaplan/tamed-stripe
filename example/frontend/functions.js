import WebView from 'react-native-webview';

const fetchLean = require('fetch-lean');

let apiBackend, routes, debugMode;
const init = async (props) => {
	debugMode = props.debugMode;
	if (debugMode) console.log(`\x1b[1;33m;API Backend: ${props.apiBackend}\x1b[0m`);
	if (debugMode) console.log(`\x1b[1;33mTo be used routes: ${JSON.stringify(props.routes)}\x1b[0m`);
	apiBackend = props.apiBackend;
	routes = props.routes;
};

const backendCaller =  (method, route, headers, props, successCallback, failCallback, absoluteURI = false) => new Promise(async (resolve, reject) => {
	let result;
	let l_url = `${absoluteURI ? '' : apiBackend}${route}`;
	if (debugMode) console.log(`Calling backend: ${l_url}\nparameters:\n${JSON.stringify(props, null, '\t')}`);
	result = await fetchLean(method, l_url, headers, props, true);
	if (result.status === 200) {
			  if (debugMode) console.log(`\x1b[0;32mBackend call success:\x1b[0m ${JSON.stringify(result, null, '\t')}`);
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
		let body = {};
		body.applicationCustomerId = props.applicationCustomerId;
		body.description = props.description;
		body.email = props.email;
		body.metadata = props.metadata;
		body.name = props.name;
		body.phone = props.phone;
		body.address = props.address;
		body.publicDomain = props.publicDomain;
		body.successRoute = props.successRoute;
		body.cancelRoute = props.cancelRoute;
		const response = backendCaller('POST', routes.generateCustomer, {}, body);
		return resolve(response);
	} catch (error) {
		if (debugMode) console.log(`\x1b[0;31mError: ${JSON.stringify(error)}\x1b[0m`);
		return reject(error);
	}
});

const CustomerWebView = (props) => {
	if (!(props?.customerCheckoutSessionUrl) || (props.customerCheckoutSessionUrl.length === 0)) return <></>;
	return <WebView
		source={{ uri: props.customerCheckoutSessionUrl }}
		style={{ marginTop: 20 }}
		onNavigationStateChange={navState => {
			console.log(navState);
			if (navState.url.includes("web-view-close")) {
				props.setCustomerCheckoutSessionUrl("");
			}
		}}
	/>;
}

const generateProduct = (props) => new Promise(async (resolve, reject) => {
	try {
		const body = {
			name: props.name,
			description: props.description,
			currency: props.currency,
			unitAmountDecimal: props.unitAmountDecimal,
			interval: props.interval,
		};
		const response = backendCaller('POST', routes.generateProduct, {}, body);
		return resolve(response);
	} catch (error) {
		if (debugMode) console.log(`\x1b[0;31mError: ${JSON.stringify(error)}\x1b[0m`);
		return reject(error);
	}
});

const generateSubscription = (props) => new Promise(async (resolve, reject) => {
	try {
		const body = {
			customerId: props.customerId,
			recurringPriceId: props.recurringPriceId,
		};
		const response = backendCaller('POST', routes.generateSubscription, {}, body);
		return resolve(response);
	} catch (error) {
		if (debugMode) console.log(`\x1b[0;31mError: ${JSON.stringify(error)}\x1b[0m`);
		return reject(error);
	}
});


const generateAccount = (props) => new Promise(async (resolve, reject) => {
	try {
		let body = {};
		body.email = props.email;
		body.publicDomain = props.publicDomain;
		body.refreshUrlRoute = props.refreshUrlRoute;
		body.returnUrlRoute = props.returnUrlRoute;
		body.capabilities = props.capabilities;
		body.country = props.country;


		let uri = `${apiBackend}${routes.generateAccount}`;

		if (debugMode) console.log(`\x1b[1;33m;Request: ${uri}\x1b[0m`);
		if (debugMode) console.log(`\x1b[1;33m;Request: ${JSON.stringify(body)}\x1b[0m`);
		const response = await fetchLean('POST', uri, {}, body);
		if (debugMode) console.log(`\x1b[0;32mResponse: ${JSON.stringify(response)}\x1b[0m`);


		return resolve(response);
	} catch (error) {
		if (debugMode) console.log(`\x1b[0;31mError: ${JSON.stringify(error)}\x1b[0m`);
		return reject(error);
	}
});



// props: accountLinkUrl, setAccountLinkUrl
const AccountWebView = (props) => {
	if (!(props?.accountLinkUrl) || (props.accountLinkUrl.length === 0)) return <></>;
	return <WebView
		source={{ uri: props.accountLinkUrl }}
		style={{ marginTop: 20 }}
		onNavigationStateChange={navState => {
			console.log(navState);
			if (navState.url.includes("account-generated")) {
				if (debugMode) console.log("Account generated");
				props.setAccountLinkUrl("");
			}
		}}
	/>;
}


module.exports = {
	init,
	generateCustomer,
	CustomerWebView: CustomerWebView,
	generateProduct,
	generateSubscription,
	generateAccount,
	AccountWebView: AccountWebView,

};