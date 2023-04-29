
import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, TextInput, Alert } from 'react-native';
import { StripeActionPage } from 'tamed-stripe-frontend';

export default function Account(props) {
	const [actionButtonClicked, setActionButtonClicked] = useState(false);
	const [flowOpen, setFlowOpen] = useState(true);
	const [accountLinkUrl, setAccountLinkUrl] = useState('');
	const [email, setEmail] = useState('test-account@accounts.com');
	const [country, setCountry] = useState('TR');

	const generateAccount = async () => {
		const now = new Date().getTime();
		const account = await props.tsf.generateAccount({
			applicationCustomerId: props.applicationCustomerId,
			email: email.toLowerCase(),
			publicDomain:  props.apiBackend,
			country: country.toUpperCase(),
		});
		props.setAccountId(account.payload.id);
		setAccountLinkUrl(account.payload.accountLinkURL);
		setActionButtonClicked(true);
	};

	const screen = actionButtonClicked
		? (flowOpen)
			? <View style={{ height: '100%', width: '100%' }}>
				<StripeActionPage
					url={accountLinkUrl}
					waitMessage={"Please open the window to continue"}
					setFlowOpen={setFlowOpen}
				/>
			</View>
			: <View style={{ borderColor: '#693', borderWidth: 1, borderRadius: 10, width: '68%', alignItems: 'center' }}>
				<Text> </Text>
				<Button
					title={`Continue`}
					onPress={() => props.setActiveScreen('OneTimePayment')}
				/>
			</View>
		: <View style={{ borderColor: '#693', borderWidth: 1, borderRadius: 10, width: '68%', alignItems: 'center' }}>
			<TextInput
				placeholder="Email"
				onChangeText={text => setEmail(text)}
				value={email}
				style={{ padding: 10, borderWidth: 1, borderRadius: 5, width: '98%' }}
			/>
			<Text> </Text>
			<TextInput
				placeholder="Country"
				onChangeText={text => setCountry(text)}
				value={country}
				style={{ padding: 10, borderWidth: 1, borderRadius: 5, width: '98%' }}
			/>
			<Text> </Text>
			<Text> </Text>
			<Button
				title="Generate Account"
				onPress={generateAccount}
			/>
			<Text> </Text>
		</View>;

	return screen;
}
