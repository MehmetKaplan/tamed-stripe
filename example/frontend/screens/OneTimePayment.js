
import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, TextInput, Alert, Linking } from 'react-native';
import { StripeActionPage } from 'tamed-stripe-frontend';


export default function OneTimePayment(props) {
	const [actionButtonClicked, setActionButtonClicked] = useState(false);
	const [flowOpen, setFlowOpen] = useState(true);

	const [oneTimePaymentUrl, setOneTimePaymentUrl] = useState('');
	const [checkoutSessionId, setCheckoutSessionId] = useState('');
	const [oneTimeChargeItem1, setOneTimeChargeItem1] = useState('Test item 1 - tax exclusive');
	const [oneTimeCharge1, setOneTimeCharge1] = useState('0');
	const [oneTimeChargeItem2, setOneTimeChargeItem2] = useState('Test item 2 - tax inclusive');
	const [oneTimeCharge2, setOneTimeCharge2] = useState('0');
	const [payoutAmount, setPayoutAmount] = useState('0');

	const tax_code = 'txcd_30060006'; // Stripe tax code for hats. :-)

	const oneTimePayment = async () => {

		const payoutData = {
			payoutAmount: payoutAmount,
			payoutAccountId: props.accountId
		}
		const items = [
			{ name: oneTimeChargeItem1, unitAmountDecimal: `${oneTimeCharge1}`, tax_code, taxBehavior: "exclusive" },
			{ name: oneTimeChargeItem2, unitAmountDecimal: `${oneTimeCharge2}`, tax_code, taxBehavior: "inclusive" },
		];
		const body = {
			applicationCustomerId: props.applicationCustomerId,
			currency: 'usd',
			items: items,
			payoutData: payoutData,
			publicDomain: props.apiBackend,
			automaticTax: { enabled: true },
		};

		const result = await props.tsf.oneTimePayment(body);
		console.log(`One Time Payment Checkout : ${JSON.stringify(result.payload, null, 2)}`);
		// wait 10 seconds for the webhook to fire
		await new Promise(resolve => setTimeout(resolve, 10000));

		setOneTimePaymentUrl(result.payload.url);
		setCheckoutSessionId(result.payload.id);
		props.setCheckoutSessionId(result.payload.id);
		setActionButtonClicked(true);
	};

	const screen = actionButtonClicked
		? (flowOpen)
			? <View style={{ height: '100%', width: '100%' }}>
				<StripeActionPage
					url={oneTimePaymentUrl}
					waitMessage={"Please open the window to continue"}
					setFlowOpen={setFlowOpen}
				/>
			</View>
			: <View style={{ borderColor: '#693', borderWidth: 1, borderRadius: 10, width: '68%', alignItems: 'center' }}>
				<Text> </Text>
				<Button
					title={`Continue`}
					onPress={async () => {
						await new Promise(resolve => setTimeout(resolve, 10000));
						const result = await props.tsf.getOneTimePaymentStatus({ checkoutSessionId });
						console.log(`One Time Payment Status : ${JSON.stringify(result.payload, null, 2)}`);
						await Linking.openURL(result.payload.rows[0].hosted_invoice_url);
						props.setActiveScreen('Refund');
					}}
				/>
			</View>
		: <View style={{ borderColor: '#693', borderWidth: 1, borderRadius: 10, width: '68%', alignItems: 'center' }}>
			<TextInput
				placeholder="Name of Item 1"
				onChangeText={text => setOneTimeChargeItem1(text)}
				value={oneTimeChargeItem1}
				style={{ padding: 10, borderWidth: 1, borderRadius: 5, width: '98%' }}
			/>
			<TextInput
				placeholder="Amount of Item 1"
				onChangeText={text => setOneTimeCharge1(text)}
				value={oneTimeCharge1}
				style={{ padding: 10, borderWidth: 1, borderRadius: 5, width: '98%' }}
			/>
			<Text> </Text>
			<TextInput
				placeholder="Name of Item 2"
				onChangeText={text => setOneTimeChargeItem2(text)}
				value={oneTimeChargeItem2}
				style={{ padding: 10, borderWidth: 1, borderRadius: 5, width: '98%' }}
			/>
			<TextInput
				placeholder="Amount of Item 2"
				onChangeText={text => setOneTimeCharge2(text)}
				value={oneTimeCharge2}
				style={{ padding: 10, borderWidth: 1, borderRadius: 5, width: '98%' }}
			/>
			<Text> </Text>
			<Text> </Text>
			<TextInput
				placeholder="Payout Amount"
				onChangeText={text => setPayoutAmount(text)}
				value={payoutAmount}
				style={{ padding: 10, borderWidth: 1, borderRadius: 5, width: '98%' }}
			/>
			<Text> </Text>
			<Button
				title="One Time Payment with Payout"
				onPress={oneTimePayment}
			/>
			<Text> </Text>
		</View>;

	return screen;
}
