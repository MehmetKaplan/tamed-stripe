// expo screen to generate a new Stripe customer


import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';

const apiBackend = require('../config.js').apiBackend();
const { generateCustomerRoute } = require('../config.js').routes;

export default function GenerateCustomer() {
	const [customer, setCustomer] = useState(undefined);
	const [email, setEmail] = useState(undefined);

	const generateCustomer = async () => {
		const response = await fetch(`${apiBackend}${generateCustomerRoute}`, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				email,
			}),
		});
		const json = await response.json();
		setCustomer(json.payload);
	}

	return (
		<View style={styles.container}>
			<TextInput
				style={styles.input}
				onChangeText={setEmail}
				value={email}
				placeholder="Email"
			/>
			<Button
				title="Generate Customer"
				onPress={generateCustomer}
			/>
			{customer && (
				<>
					<Text>Customer ID: {customer.id}</Text>
					<Text>Customer Ephemeral Key Secret: {customer.ephemeralKeySecret}</Text>
					<Text>Customer Payment Intent Client Secret: {customer.paymentIntentClientSecret}</Text>
				</>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',
	},
	input: {
		height: 40,
		margin: 12,
		borderWidth: 1,
	},
});

