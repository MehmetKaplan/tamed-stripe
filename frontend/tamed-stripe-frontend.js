import WebView from 'react-native-webview';

const { 
	init,
	generateCustomer,
	getCustomer,
	generateProduct,
	generateSubscription,
	generateAccount,
	getAccount,
	oneTimePayment,
	getOneTimePaymentStatus,
	exportedForTesting
} = require("./tamed-stripe-frontend-api-callers.js");

/* istanbul ignore next */
const StripeActionWebView = (props) => {
	if (!(props?.setUrl) || (props.url.length === 0)) return <></>;
	return <WebView
		source={{ uri: props.url }}
		style={{ marginTop: 20 }}
		onNavigationStateChange={navState => {
			console.log(navState);
			if (navState.url.includes("web-view-close")) {
				props.setUrl("");
			}
		}}
	/>;
}

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
	StripeActionWebView: StripeActionWebView,
	exportedForTesting
};