
import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, TextInput, Alert } from 'react-native';

import Customer from './screens/Customer';
import Subscription from './screens/Subscription';
import Account from './screens/Account';
import OneTimePayment from './screens/OneTimePayment';
import EndApp from './screens/EndApp';

import * as tsf from 'tamed-stripe-frontend';

const apiBackend = "https://development.eseme.one:61983";

export default function App() {
	const [activeScreen, setActiveScreen] = useState('Customer');
	const [customerId, setCustomerId] = useState('');
	const [subscriptionId, setSubscriptionId] = useState('');
	const [accountId, setAccountId] = useState('');
	const [applicationCustomerId, setApplicationCustomerId] = useState(`Mobile App Test Application Customer-${(new Date()).getTime()}`);


	useEffect(() => {
		tsf.init({
			apiBackend: apiBackend,
			routes: {
				"generateCustomer": "/generate-customer",
				"generateSubscription": "/generate-subscription",
				"getSubscriptionPayments": "/get-subscription-payments",
				"generateProduct": "/generate-product",
				"generateAccount": "/generate-account",
				"oneTimePayment": "/one-time-payment",
				"getOneTimePaymentStatus": "/get-one-time-payment-status",
				"getSubscriptionPaymentsByStripeCustomerId": "/test/get-subscription-payments-by-stripe-customer-id",
			},
			debugMode: true
		});
	}, []);

	let screen;
	switch (activeScreen) {
		case 'Customer':
			screen = <Customer apiBackend={apiBackend} tsf={tsf} setActiveScreen={setActiveScreen} applicationCustomerId={applicationCustomerId} setCustomerId={setCustomerId} />
			break;
		case 'Subscription':
			screen = <Subscription tsf={tsf} setActiveScreen={setActiveScreen} applicationCustomerId={applicationCustomerId} setSubscriptionId={setSubscriptionId} />
			break;
		case 'Account':
			screen = <Account apiBackend={apiBackend} tsf={tsf} setActiveScreen={setActiveScreen} applicationCustomerId={applicationCustomerId} setAccountId={setAccountId} />
			break;
		case 'OneTimePayment':
			screen = <OneTimePayment apiBackend={apiBackend} tsf={tsf} setActiveScreen={setActiveScreen} applicationCustomerId={applicationCustomerId} accountId={accountId} />
			break;
		case 'EndApp':
			screen = <EndApp />
			break;
		default:
			screen = <Customer apiBackend={apiBackend} tsf={tsf} setActiveScreen={setActiveScreen} applicationCustomerId={applicationCustomerId} setCustomerId={setCustomerId} />
			break;
	}
	return <View style={styles.container}>
		{screen}
	</View>;
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',
	},
});
