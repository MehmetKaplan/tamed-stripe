import {useEffect, useState} from 'react';
import ReactNativeWebviewWithWeb from 'react-native-webview-with-web';

/* istanbul ignore next */
const StripeActionPage = (props) => {
	const [url, setUrl] = useState('');
	const [waitMessage, setWaitMessage] = useState('Stripe process ongoing in new window');
	useEffect(() => {setUrl(props.url)}, [props.url]);
	useEffect(() => {setWaitMessage(props.waitMessage)}, [props.waitMessage]);
	useEffect(() => {
		if (url.length === '') props.flowFinished(true);
	}, [url]);
	return <ReactNativeWebviewWithWeb
		url={url}
		setUrl={setUrl}
		closeRouteIncludes={'web-view-close'}
		waitMessage={waitMessage}
	/>;
}

/* istanbul ignore next */
module.exports = {
	StripeActionPage
};
