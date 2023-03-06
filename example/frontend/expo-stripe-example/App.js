import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button } from 'react-native';

import { init, generateCustomer, generateAccount, AccountWebView, CustomerWebView } from './functions.js';

export default function App() {
	const [accountLinkUrl, setAccountLinkUrl] = useState('');

	const [customerCheckoutSessionUrl, setCustomerCheckoutSessionUrl] = useState('');

	
	useEffect(() => {
		init({
			apiBackend: "https://development.eseme.one:61983",
			routes: {
				"generateCustomer": "/generate-customer",
				"generateAccount": "/generate-account"
			},
			debugMode: true
		});
	}, []);
	const generateCustomer_ = async () => {
		const result = await generateCustomer({
			"description": "Generated by JEST tests. Customer 1676290904050",
			"email": "1676290904050@yopmail.com",
			"metadata": {
				"testField": "testValue1",
				"testField2": "testValue2"
			},
			"name": "Customer 1676290904050",
			"phone": "+1 555 555 5555",
			"address": {
				"city": "San Francisco",
				"country": "US",
				"line1": "1234 Main Street",
				"line2": "Apt. 4",
				"postal_code": "94111",
				"state": "CA"
			},
			"publicDomain": "https://development.eseme.one:61983",
			"successRoute": "/generate-customer-success-route",
			"cancelRoute": "/generate-customer-cancel-route",
		});
		setCustomerCheckoutSessionUrl(result.payload.checkoutSession.url)
	};

	const generateAccount_ = async () => {
		// Stripe generate account and let user complete the process
		const account = await generateAccount({
			"email": "1676290904050@yopmail.com",
			"publicDomain": "https://development.eseme.one:61983",
			"refreshUrlRoute": "/account-authorize",
			"returnUrlRoute": "/account-generated",
			"country": "TR",
		});
		setAccountLinkUrl(account.payload.accountLinkURL);
	};

	let screen = <View style={styles.container}>
		<Text>Open up App.js to start working on your app!</Text>
		<StatusBar style="auto" />
		<Button
			title="Generate Customer"
			onPress={generateCustomer_}
		/>
		<Text> </Text>
		<Button
			title="Generate Account"
			onPress={generateAccount_}
		/>
		<Text> </Text>
	</View>;

	if (accountLinkUrl.length > 0) screen = <AccountWebView
		accountLinkUrl={accountLinkUrl}
		setAccountLinkUrl={setAccountLinkUrl}
	/>;

	if (customerCheckoutSessionUrl.length > 0) screen = <CustomerWebView
		customerCheckoutSessionUrl={customerCheckoutSessionUrl}
		setCustomerCheckoutSessionUrl={setCustomerCheckoutSessionUrl}
	/>;
	
	return screen;
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',
	},
});
