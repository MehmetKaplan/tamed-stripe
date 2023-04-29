## WHY?

This is the frontend library for the Tamed Stripe architecture. This library aims to provide the frontend functions that can be used to communicate with the `tamed-stripe-backend`. It supports easy to adopt methods  for basic customer generation, connected account generation, subscription generation and payment functions.

## SETUP

0. Assure the database and backend applications are up and running.

1. Install the library with peer dependencies


```
yarn add tamed-stripe-frontend react-native-webview@11.26.0 react-native-webview-with-web
```

2. import the library


```
import tsf from 'tamed-stripe-frontend';
import { StripeActionPage } from 'tamed-stripe-frontend';
```

At this point you can use the library.


### API

### init

This function initializes the library with the backend url and routes.

If you are using the backend library, you can use the below exact same code.

#### Example

```javascript
useEffect(() => {
	tsf.init({
		apiBackend: apiBackend,
		routes: {
			"generateCustomer": "/generate-customer",
			"generateSubscription": "/generate-subscription",
			"generateProduct": "/generate-product",
			"generateAccount": "/generate-account",
			"oneTimePayment": "/one-time-payment",
			"getOneTimePaymentStatus": "/get-one-time-payment-status",
			"getSubscriptionPaymentsByStripeCustomerId": "/test/get-subscription-payments-by-stripe-customer-id",
		},
		debugMode: true
	});
}, []);

```

### StripeActionPage

Uses `react-native-webview` to show the Stripe action pages.

#### props

| Name | Type | Description |
| --- | --- | --- |
| url | string | The url to be shown in the webview. |
| setUrl | function | The function to be called when the url changes. Using this function caller can be signalled to close the web view. For example by setting the url as `''` and detecting zero length url from the caller.|
#### Example

```react
<StripeActionPage
	url={accountLinkUrl}
	setUrl={setAccountLinkUrl}
/>
```

For an example usage of closing webview, please refer to the [example application](https://github.com/MehmetKaplan/tamed-stripe/blob/9ce7fdb5416211b1ba5b112857b302867f8f5725/example/frontend/screens/Account.js#L27).

### generateCustomer

Generates a stripe customer and links the stripe customer and application customer using the backend [generateCustomer](https://github.com/MehmetKaplan/tamed-stripe/tree/master/backend#generatecustomer)

| Name | Type | Description |
| --- | --- | --- |
| props | object | The props object. |

#### props

| Name | Type | Description |
| --- | --- | --- |
| applicationCustomerId | string | The application customer id. |
| description | string | The description of the customer. |
| email | string | The email of the customer. |
| metadata | object | The metadata for the customer. |
| name | string | The name of the customer. |
| phone | string | The phone number of the customer. |
| address | object | The address of the customer. |
| publicDomain | string | The public domain of the application. |
| successRoute | string | The route to be called when the customer is successfully generated. |
| cancelRoute | string | The route to be called when the customer generation is cancelled. |

##### address

| Name | Type | Description |
| --- | --- | --- |
|city | string | City of the customer. |
|country | string | Country of the customer. |
|line1 | string | Line 1 of the address of the customer. |
|line2 | string | Line 2 of the address of the customer. |
|postal_code | string | Postal code of the customer. |
|state | string | State of the customer. |

#### Returns

Returns a customer object and a checkout session. Use the checkout session to redirect the user to the checkout page to collect default payment method.

```javascript
{
	result: 'OK',
	payload: {
		customer,
		checkoutSession
	},
}
```

#### Example

```javascript
const [customerCheckoutSessionUrl, setCustomerCheckoutSessionUrl] = useState('');
...
const result = await tsf.generateCustomer({
	applicationCustomerId: applicationCustomerId,
	description: `Mobile App Test Customer`,
	email: email,
	metadata: { "test": "test" },
	name: `Mobile App Test Customer`,
	phone: `1234567890`,
	address: { "line1": "1234 Main St", "city": "San Francisco", "state": "CA", "postal_code": "94111" },
	publicDomain: apiBackend,
});
setCustomerCheckoutSessionUrl(result.payload.checkoutSession.url);

...
const screen = (customerCheckoutSessionUrl.length > 0)
		? <View style={{ height: '100%', width: '100%' }}>
			<StripeActionPage
				url={customerCheckoutSessionUrl}
				setUrl={setCustomerCheckoutSessionUrl}
			/>
		</View>
		: <> </>
...
```

### getCustomer

Gets a stripe customer using the backend [getCustomer](https://github.com/MehmetKaplan/tamed-stripe/tree/master/backend#getcustomer)

| Name | Type | Description |
| --- | --- | --- |
| props | object | The props object. |

#### props

| Name | Type | Description |
| --- | --- | --- |
| applicationCustomerId | string | The application customer id. |

#### Returns

Returns a customer object.

```javascript
{
	result: 'OK',
	payload: {
		customer
	},
}
```

#### Example

```javascript
const result = await tsf.getCustomer({
	applicationCustomerId: applicationCustomerId,
});
```

### generateProduct

Generates a product to be used for subscription generation using the backend [generateProduct](https://github.com/MehmetKaplan/tamed-stripe/tree/master/backend#generateproduct)

| Name | Type | Description |
| --- | --- | --- |
| props | object | The props object. |

#### props

| Name | Type | Description |
| --- | --- | --- |
| name | string | The name of the product. |
| description | string | The description of the product. |
| currency | string | The currency of the product. |
| unitAmountDecimal | string | The unit amount of the product. In cents. |
| interval | string | The interval of the product. This can be one of following values; `'day'`, `'week'`, `'month'`, `'year'`. |
 
#### Returns

Returns a product and a price object in the payload

```javascript
{
	result: 'OK',
	payload: {
		product,
		price
	}
}
```

#### Example

```javascript
const resultProduct = await tsf.generateProduct({
	name: subscriptionName,
	description: subscriptionName,
	currency: 'usd',
	unitAmountDecimal: `${subscriptionCharge}`,
	interval: 'month',
});
```

### generateSubscription

Generates a subscription using the backend [generateSubscription](https://github.com/MehmetKaplan/tamed-stripe/tree/master/backend#generatesubscription).

| Name | Type | Description |
| --- | --- | --- |
| props | object | The props object. |

#### props

| Name | Type | Description |
| --- | --- | --- |
| applicationCustomerId | string | The application's customer id. |
| recurringPriceId | string | The stripe price id of the recurring price. Comes from [generateProduct](https://github.com/MehmetKaplan/tamed-stripe/tree/master/frontend#generateproduct). |
| description | string | The description of the subscription. |
#### Returns

Returns a subscription object.

```javascript
{
	result: 'OK',
	payload: subscription,
}
```

#### Example

```javascript
// first generate a product
const resultProduct = await tsf.generateProduct({
	name: subscriptionName,
	description: subscriptionName,
	currency: 'usd',
	unitAmountDecimal: `${subscriptionCharge}`,
	interval: 'month',
});
// then generate a subscription using the product
const resultSubscription = await tsf.generateSubscription({
	applicationCustomerId: props.applicationCustomerId,
	recurringPriceId: resultProduct.payload.price.id,
	description: `${subscriptionName} Subscription`,
});
```

### getSubscriptionPaymentsByStripeCustomerId

Gets the DB rows indicating all subscription payments history for a certain stripe customer id. For a particular product's subscription, the returned rows should be filtered by the `stripe_product_id` field at the application side.

| Name | Type | Description |
| --- | --- | --- |
| props | object | The props object. |

#### props

| Name | Type | Description |
| --- | --- | --- |
| customerId | string | The stripe customer id that the payments are to be retrieved for. | 

#### Returns

Returns the DB rows indicating all subscription payments history for a certain stripe customer id.

```javascript
{
	result: 'OK',
	payload: rows,
}
```

#### Example

```javascript
const payments = await tsf.exportedForTesting.getSubscriptionPaymentsByStripeCustomerId({
	customerId: customerId
});
```

### generateAccount

Generates a connected account that is to be used as a **payee**, using the backend [generateAccount](https://github.com/MehmetKaplan/tamed-stripe/tree/master/backend#generateaccount). The returned account URL should be used to initiate the account creation process. Similarly, for a process started earlier but not concluded, same method can be called to continue the registration process on Stripe.

| Name | Type | Description |
| --- | --- | --- |
| props | object | The props object. |

#### props

| Name | Type | Description |
| --- | --- | --- |
| applicationCustomerId | string | The application customer id, used to link the application customer to the Stripe connected account. |
| email | string | The email of the connected account. |
| publicDomain | string | The public domain of the application. |
| country | string | The country of the connected account, defaults to 'US'. |
| refreshUrlRoute | string | Route for the refresh URL. Defaults to `/generate-account-cancel-route` for which the route can be handled by this library. |
| returnUrlRoute | string | Route for the return URL. Defaults to `/generate-account-success-route` for which the route can be handled by this library. |


#### Returns

You should expect 3 different responses from this function.

- If there is a successfully generated account for the given applicationCustomerId, then the response will be as below, and the payload.id can be used as Stripe side payee (connected_account) id.

```javascript
{
	result: 'OK',
	payload: {
		id: result.rows[0].stripe_account_id,
		accountLinkURL: ''
	}
}
```

- If previously account generation process started but the end user did not complete the process, then the response will be as below, and the payload.accountLinkURL can be used to redirect the end user to the Stripe's website to complete the account generation process. Use the accountLinkURL field to redirect the end user to the Stripe's website to complete the account generation process.

```javascript
{
	result: 'OK',
	payload: {
		id: result.rows[0].stripe_account_id,
		accountLinkURL: accountLinkForW.url,
		urlRegenerated: true
	}
}
```

- If there is no account for the given applicationCustomerId, then the response will be as below, and the payload.accountLinkURL can be used to redirect the end user to the Stripe's website to start the account generation process.

```javascript
{
	result: 'OK',
	payload: {
		result: 'OK',
		payload: account,
	}
}
```
#### Example

```javascript
const [accountLinkUrl, setAccountLinkUrl] = useState('');
...
const generateAccount = async () => {
	const now = new Date().getTime();
	const account = await tsf.generateAccount({
		applicationCustomerId,
		email,
		publicDomain: apiBackend,
		country: country.toUpperCase(),
	});
	setAccountLinkUrl(account.payload.accountLinkURL);
};
...
const screen = (accountLinkUrl.length > 0)
	? <View style={{ height: '100%', width: '100%' }}>
		<StripeActionPage
			url={accountLinkUrl}
			setUrl={setAccountLinkUrl}
		/>
	</View>
	: <> </>
...
```

### getAccount

Gets the connected account that is to be used as a **payee**, using the backend [getAccount](https://github.com/MehmetKaplan/tamed-stripe/tree/master/backend#getaccount).

| Name | Type | Description |
| --- | --- | --- |
| props | object | The props object. |

#### props

| Name | Type | Description |
| --- | --- | --- |
| applicationCustomerId | string | The application customer id, used to link the application customer to the Stripe connected account. |

#### Returns

Returns the connected account that is to be used as a **payee**.

```javascript
{
	result: 'OK',
	payload: account,
}
```

#### Example

```javascript
const account = await tsf.getAccount({
	applicationCustomerId: applicationCustomerId,
});
```

### oneTimePayment

Generates a checkout session that is to be used to charge a customer and optionally transfer a portion to a payee, using the backend [oneTimePayment](https://github.com/MehmetKaplan/tamed-stripe/tree/master/backend#onetimepayment).

| Name | Type | Description |
| --- | --- | --- |
| props | object | The props object. |

#### props

| Name | Type | Description |
| --- | --- | --- |
| applicationCustomerId | string | The application customer id, used to link the application customer to the payment. |
| currency | string | The currency of the payment. Defaults to `'usd'` |
| items | Array | The items to be charged. |
| payoutData | Object | The payout data. |
| publicDomain | Public domain of the server, to use the return URLs. |

##### items

Array of objects, each object should have the following fields:

| Name | Type | Description |
| --- | --- | --- |
| name | string | The name of the item. |
| amount | number | The amount of the item, in cents. |

##### payoutData

| Name | Type | Description |
| --- | --- | --- |
| payoutAccountId | string | Stripe account id of the payee. |
| payoutAmount | string | Amount to be paid to the payee, in cents. |

#### Returns

Returns the checkoutSession object created by Stripe. The `url` field of the returned payload can be used to redirect the end user to the Stripe's website to complete the payment process.

```javascript
{
	result: 'OK',
	payload: checkoutSession,
}
```

#### Example

```javascript
const [oneTimePaymentUrl, setOneTimePaymentUrl] = useState('');
...
const oneTimePayment = async () => {
	const payoutData = {
		payoutAmount,
		payoutAccountId,
	}
	const items = [
		{ name: oneTimeChargeItem1, unitAmountDecimal: `${oneTimeCharge1}`, },
		{ name: oneTimeChargeItem2, unitAmountDecimal: `${oneTimeCharge2}`, },
	];
	const body = {
		applicationCustomerId,
		currency: 'usd',
		items,
		payoutData,
		publicDomain: apiBackend,
	};

	const result = await tsf.oneTimePayment(body);
	// wait 10 seconds for the webhook to fire
	await new Promise(resolve => setTimeout(resolve, 10000));

	setOneTimePaymentUrl(result.payload.url);
};

...
const screen = (oneTimePaymentUrl.length > 0)
		? <View style={{ height: '100%', width: '100%' }}>
			<StripeActionPage
				url={oneTimePaymentUrl}
				setUrl={setOneTimePaymentUrl}
			/>
		</View>
		: <> </>
...
```


### getOneTimePaymentStatus

Used to get the current status of a checkout session using the backend [getOneTimePaymentStatus](https://github.com/MehmetKaplan/tamed-stripe/tree/master/backend#getonetimepaymentstatus).

| Name | Type | Description |
| --- | --- | --- |
| props | object | The props object. |

#### props

| Name | Type | Description |
| --- | --- | --- |
| checkoutSessionId | string | The checkout session id. |

#### Returns


The `payload` holds the database state of the requested payment.
```javascript
{
	result: 'OK',
	payload: rows,
}
```

The `payload.rows[0]` is a database row in the following form:

```sql
 id |              application_customer_id               | stripe_customer_id |                        checkout_session_id                         |        update_time         | total_amount_decimal | currency | state |         invoice_id          |                                                                      hosted_invoice_url                                                                       | payout_amount |   payout_account_id   | payout_state 
----+----------------------------------------------------+--------------------+--------------------------------------------------------------------+----------------------------+----------------------+----------+-------+-----------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------+---------------+-----------------------+--------------
  2 | Application Customer-1679582193973                 | cus_... | cs_xxxx... | 2023-03-24 14:34:57.000013 |               450000 | eur      | P     | in_... | https://invoice.stripe.com/i/acct_.../test_...?s=ap |        225000 | acct_... | W

```
Here the `state = 'P'` means the payment is completed. And you can ues the url in the `hosted_invoice_url` field to show the invoice to the customer.

#### Example

```javascript
const result = await tsf.getOneTimePaymentStatus({checkoutSessionId});
console.log(`One Time Payment Status : ${JSON.stringify(result.payload.rows[0], null, 2)}`);

```

## More Examples

The example application (made with react-native and Expo) can be found [here](https://github.com/MehmetKaplan/tamed-stripe/blob/master/example/frontend).
Also the jest test cases can be used as examples, which can be found [here](https://github.com/MehmetKaplan/tamed-stripe/blob/master/frontend/__tests__/).

## License

The license is MIT and full text [here](https://github.com/MehmetKaplan/tamed-stripe/blob/master/LICENSE).

#### Used Modules

Please refer to the [main github page](https://github.com/MehmetKaplan/tamed-stripe) for the list of used modules. 