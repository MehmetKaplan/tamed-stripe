import * as React from 'react';
import ReactNativeWebviewWithWeb from 'react-native-webview-with-web';

/* istanbul ignore next */
const StripeActionPage = (props) => {
	const [urlReceived, setUrlReceived] = React.useState(false);
	const [url, setUrl] = React.useState('');
	const [waitMessage, setWaitMessage] = React.useState('Stripe process ongoing in new window');
	React.useEffect(() => {
		setUrl(props.url)
		if (props.url.length > 0) setUrlReceived(true);
	}, [props.url]);
	React.useEffect(() => { setWaitMessage(props.waitMessage) }, [props.waitMessage]);
	React.useEffect(() => {
		if (!urlReceived) return;
		if (url.length === 0) props.setFlowOpen(false);
	}, [url]);
	return (
			<ReactNativeWebviewWithWeb
				url={url}
				setUrl={setUrl}
				closeRouteIncludes={'web-view-close'}
				waitMessage={waitMessage}
			/>
	);
}

/* istanbul ignore next */
export default {
	StripeActionPage
};
