import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button } from 'react-native';

import { StripeProvider } from '@stripe/stripe-react-native';

import fetchLean from 'fetch-lean';

let now = new Date().getTime();

// parameters to call the frontend library
let port = 61983;
let apiBackend = `http://development.computatus.com:${port}`;
let method = "POST";
let routes = {
	generateCustomer: "/generate-customer"
}
let description = `expo-stripe-usage-example Customer ${now}`;
let email = `${now}@yopmail.com`;
let metadata = {
	"testField": "testValue1",
	"testField2": "testValue2"
};
let name = `Customer ${now}`;
let phone = `+1 ${now}`;
let address = {
	"city": "San Francisco",
	"country": "US",
	"line1": `${now} Main Street`,
	"line2": "Apt. 4",
	"postal_code": "94111",
	"state": "CA"
};

export default function App() {

	generateCustomer = async () => {
		let data = {
			"props": {
				"description": description,
				"email": email,
				"metadata": metadata,
				"name": name,
				"phone": phone,
				"address": address
			}
		};
		retVal = await fetchLean(method, `${apiBackend}${routes.generateCustomer}`, {}, data);
		console.log(retVal);
	}


	return (
		<View style={styles.container}>
			<Text>Open up App.js to start working on your app!</Text>
			<StatusBar style="auto" />
			<Button
				title="Generate Customer"
				onPress={generateCustomer}

			/>
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
});
