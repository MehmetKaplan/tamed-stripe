
import { useState, useEffect } from 'react';
import { Text, View, Button, TextInput, Alert, Linking } from 'react-native';

export default function Refund(props) {
	const [actionButtonClicked, setActionButtonClicked] = useState(false);
	const [checkoutSessionId, setCheckoutSessionId] = useState('');

	useEffect(() => {
		setCheckoutSessionId(props.checkoutSessionId);
	}, [props.checkoutSessionId]); 

	const refundOneTimePayment = async () => {
		const refundResult = await props.tsf.refundOneTimePayment({
			checkoutSessionId: checkoutSessionId
		});
		console.log(`refundResult : ${JSON.stringify(refundResult, null, 2)}`);
		setActionButtonClicked(true)
	};


	const screen = (actionButtonClicked)
		? <View style={{ borderColor: '#693', borderWidth: 1, borderRadius: 10, width: '68%', alignItems: 'center' }}>
			<Text> </Text>
			<Button
				title={`Continue`}
				onPress={() => props.setActiveScreen('EndApp')}
			/>
		</View>
		: <View style={{ borderColor: '#693', borderWidth: 1, borderRadius: 10, width: '68%', alignItems: 'center' }}>
			<Text> </Text>
			<TextInput
				placeholder="Checkout Session ID"
				onChangeText={text => setCheckoutSessionId(text)}
				value={checkoutSessionId}
				style={{ padding: 10, borderWidth: 1, borderRadius: 5, width: '98%' }}
			/>
			<Text> </Text>
			<Button
				title="Refund"
				onPress={refundOneTimePayment}
			/>
			<Text> </Text>
		</View>;

	return screen;
}
