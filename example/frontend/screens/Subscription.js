
import { useState } from 'react';
import { Text, View, Button, TextInput, Alert, Linking } from 'react-native';

export default function Subscription(props) {
	const [actionButtonClicked, setActionButtonClicked] = useState(false);
	const [subscriptionName, setSubscriptionName] = useState('Test subscription');
	const [subscriptionCharge, setSubscriptionCharge] = useState('0');


	const generateSubscription = async () => {
		const resultProduct = await props.tsf.generateProduct({
			name: subscriptionName,
			description: subscriptionName,
			currency: 'usd',
			unitAmountDecimal: `${subscriptionCharge}`,
			interval: 'month',
			taxBehavior: 'exclusive',
			taxCode: 'txcd_30060006' // Stripe tax code for hats. :-) 
		});
		const resultSubscription = await props.tsf.generateSubscription({
			applicationCustomerId: props.applicationCustomerId,
			recurringPriceId: resultProduct.payload.price.id,
			description: `${subscriptionName} Subscription`,
			automaticTax: { enabled: true },
			unlinkIfSubscriptionFails: true,
		});
		console.log(`Subscription : ${JSON.stringify(resultSubscription.payload, null, 2)}`);
		props.setSubscriptionId(resultSubscription.payload.id);
		// wait 10 seconds for the webhook to fire
		await new Promise(resolve => setTimeout(resolve, 10000));
		const payments = await props.tsf.getSubscriptionPayments({
			applicationCustomerId: props.applicationCustomerId,
		});
		console.log(`Payments : ${JSON.stringify(payments.payload, null, 2)}`);
		await Linking.openURL(payments.payload[0].hosted_invoice_url);
		setActionButtonClicked(true)
	}


	const screen = actionButtonClicked
		? <View style={{ borderColor: '#693', borderWidth: 1, borderRadius: 10, width: '68%', alignItems: 'center' }}>
			<Text> </Text>
			<Button
				title={`Continue`}
				onPress={() => props.setActiveScreen('Account')}
			/>
		</View>
		: <View style={{ borderColor: '#693', borderWidth: 1, borderRadius: 10, width: '68%', alignItems: 'center' }}>
			<Text> </Text>
			<TextInput
				placeholder="Subscription Name"
				onChangeText={text => setSubscriptionName(text)}
				value={subscriptionName}
				style={{ padding: 10, borderWidth: 1, borderRadius: 5, width: '98%' }}
			/>
			<Text> </Text>
			<TextInput
				placeholder="Subscription Charge (cents)"
				onChangeText={text => setSubscriptionCharge(text)}
				value={subscriptionCharge}
				style={{ padding: 10, borderWidth: 1, borderRadius: 5, width: '98%' }}
			/>
			<Text> </Text>
			<Button
				title="Generate Subscription"
				onPress={generateSubscription}
			/>
			<Text> </Text>
		</View>;

	return screen;
}
