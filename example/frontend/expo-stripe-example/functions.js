import WebView from 'react-native-webview';

const fetchLean = require('fetch-lean');

let apiBackend, routes, debugMode;
const init = async (props) => {
	debugMode = props.debugMode;
	if (debugMode) console.log(`\x1b[1;33m;API Backend: ${props.apiBackend}\x1b[0m`);
	if (debugMode) console.log(`\x1b[1;33m;To be used routes: ${JSON.stringify(props.routes)}\x1b[0m`);
	apiBackend = props.apiBackend;
	routes = props.routes;
};

const generateCustomer = (props) => new Promise(async (resolve, reject) => {
	try {
		let body = {};
		body.description = props.description;
		body.email = props.email;
		body.metadata = props.metadata;
		body.name = props.name;
		body.phone = props.phone;
		body.address = props.address;


		let uri = `${apiBackend}${routes.generateCustomer}`;

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
	generateAccount,
	AccountWebView: AccountWebView,

};