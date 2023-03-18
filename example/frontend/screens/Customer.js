
import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, TextInput, Alert } from 'react-native';
import { StripeActionWebView } from '../functions.js';

export default function Customer(props) {
	const [actionButtonClicked, setActionButtonClicked] = useState(false);
	const [email, setEmail] = useState('test@test.com');
	const [customerCheckoutSessionUrl, setCustomerCheckoutSessionUrl] = useState('');


	const generateCustomer = async () => {
		const now = new Date().getTime();
		const result = await props.tsf.generateCustomer({
			applicationCustomerId: props.applicationCustomerId,
			description: `Mobile App Test Customer ${now}`,
			email: email,
			metadata: { "test": "test" },
			name: `Mobile App Test Customer ${now}`,
			phone: `1234567890`,
			address: { "line1": "1234 Main St", "city": "San Francisco", "state": "CA", "postal_code": "94111" },
			publicDomain:  props.apiBackend,
		});
		setCustomerCheckoutSessionUrl(result.payload.checkoutSession.url);
		props.setCustomerId(result.payload.customer.id);
		setActionButtonClicked(true);
	};


	const screen = actionButtonClicked
		? (customerCheckoutSessionUrl.length > 0)
			? <View style={{ height: '100%', width: '100%' }}>
				<StripeActionWebView
					url={customerCheckoutSessionUrl}
					setUrl={setCustomerCheckoutSessionUrl}
				/>
			</View>
			: <View style={{ borderColor: '#693', borderWidth: 1, borderRadius: 10, width: '68%', alignItems: 'center' }}>
				<Text> </Text>
				<Button
					title={`Continue`}
					onPress={() => props.setActiveScreen('Subscription')}
				/>
			</View>
		: <View style={{ borderColor: '#693', borderWidth: 1, borderRadius: 10, width: '68%', alignItems: 'center' }}>
			<Text> </Text>
			<TextInput
				placeholder="Email"
				onChangeText={text => setEmail(text)}
				value={email}
				style={{ padding: 10, borderWidth: 1, borderRadius: 5, width: '98%' }}
			/>
			<Text> </Text>
			<Button
				title={`Generate Customer\n(with Credit Card)`}
				onPress={generateCustomer}
			/>
		</View>;

	return screen;
}
