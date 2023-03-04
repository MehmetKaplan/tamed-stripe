## WHY?

This is the backend library for the Tamed Stripe architecture. This library aims to provide the backend integrations with the Stripe API servers for basic customer generation, connected account generation, payment and refund functions.

## SETUP

1. Add the backend library to the backend of your project.

```bash
yarn add tamed-stripe-backend
```

2. Initialize parameters (modify below object according to your environment)

	Use [this file](https://github.com/MehmetKaplan/tamed-stripe/blob/master/example/backend/server-parameters.js) as a template for your backend configuration. This file is to be `require`d by your express server in the next step. **You should modify the credentials, according to your environment.**

	| Key | Type | Value |
	| --- | --- | --- |
	| pgKeys | Object | PostgreSQL connection parameters. |
	| httpsKeys | Object | HTTPS connection parameters. |
	| port | Number | Port number for the server. |
	
3. Call the `init` function of the library to initialize the db connection pool. And then start your server. As a reference you can use [this file](https://github.com/MehmetKaplan/tamed-stripe/blob/master/example/backend/server.js).

## API

### `init`

| Parameter | Type | Description |
| --- | --- | --- |
| p_params | Object | Parameters for the backend server. |

#### `p_params`

| Key | Type | Value |
| --- | --- | --- |
| pgKeys | Object | PostgreSQL connection parameters. |
| httpsKeys | Object | HTTPS connection parameters. |
| port | Number | Port number for the server. |

**Returns:** If successful, resolves to `true`. Otherwise, rejects with an error message.

**Example:**
```javascript
await tsb.init({
	debugMode: true,
	// coming from database-setup
	pgKeys: {
		user: 'tamedstripeapp',
		password: 'tamedstripeapp.', 
		database: 'tamedstripedb',
		host: 'localhost',
		port: 5432,
	},
	port: 3000,
});
```

### generateCustomer

Generates a **payer** customer at Stripe.

| Parameter | Type | Description |
| --- | --- | --- |
| body | Object | Parameters for the generating a payer customer at Stripe |

#### `body`

| Key | Type | Value |
| --- | --- | --- |
| description | string | Description of the customer. |
| email | string | Email of the customer. |
| metadata | Object | Metadata for the customer, you can embed andy data within this object, it is kept in Stripe servers also. |
| name | string | Name of the customer. |
| phone | string | Phone number of the customer. |
| address | Object | Address of the customer. |

###### `address`

| Key | Type | Value |
| --- | --- | --- |
| city | string | City of the customer. |
| country | string | Country of the customer. |
| line1 | string | Line 1 of the address of the customer. |
| line2 | string | Line 2 of the address of the customer. |
| postal_code | string | Postal code of the customer. |
| state | string | State of the customer. |

**Returns:** If successful, resolves to below JSON object. Otherwise, rejects with an error message.
```js
{
	result: 'OK',
	payload: customer,
}
```

**Example:**
```javascript
	const body = {
		description, email, metadata, name, phone, address
	};
	let response = await tsb.generateCustomer(body);
```


### generateProduct

Generates a product that can be used in checkout sessions.

| Parameter | Type | Description |
| --- | --- | --- |
| body | Object | Parameters for the generating a payer customer at Stripe |

#### `body`

| Key | Type | Value |
| --- | --- | --- |
| name | string | Name of the product. |
| description | string | Description of the product. |
| currency | string | Currency of the product. |
| unitAmountDecimal | number | Unit amount of the product **in CENTS**. |


**Returns:** If successful, resolves to below JSON object. Otherwise, rejects with an error message.
```js
{
	result: 'OK',
	payload: product,
}
```

**Example:**
```javascript
	const body = {
		name: 'Test Product',
		description: 'Test Product Description',
		currency: 'usd',
		unitAmountDecimal: 1000, // $10.00
	};
	let response = await tsb.generateProduct(body);
```

### generateCheckoutForSubscription

Generates a Stripe checkout session for monthly subscriptions.

| Parameter | Type | Description |
| --- | --- | --- |
| body | Object | Parameters for the generating a payer customer at Stripe |

#### `body`

| Key | Type | Value |
| --- | --- | --- |
| stripeProductName | string | Name of the product. |
| currency | string | Currency of the product. |
| unitAmountDecimal | number | Unit amount of the product **in CENTS**. |
| publicDomain | string | Public domain of the website. |
| successRoute | string | Route to redirect to on successful checkout. |
| cancelRoute | string | Route to redirect to on cancelled checkout. |

**Returns:** If successful, resolves to below JSON object. Otherwise, rejects with an error message.
```js
{
	result: 'OK',
	payload: subscriptionCheckoutSession,
}
```

**Example:**
```javascript
	const body = {
		stripeProductName: 'Test Product',
		currency: 'usd',
		unitAmountDecimal: 1000, // $10.00
		publicDomain: 'https://www.example.com',
		successRoute: '/subscription-checkout-success',
		cancelRoute: '/subscription-checkout-cancel',
	};
	let response = await tsb.generateCheckoutForSubscription(body);
```

### generateAccount

Generates a **payee** account (aka connected account) at Stripe and its associated account link for the end user to complete the account generation process on Stripe.

| Parameter | Type | Description |
| --- | --- | --- |
| body | Object | Parameters for the generating a payee account at Stripe |

#### `body`

| Key | Type | Value |
| --- | --- | --- |
| email | string | Email of the account. |
| publicDomain | String | Public domain of the server, to use the return URLs. |
| refreshUrlRoute | String | Route for the refresh URL. |
| returnUrlRoute | String | Route for the return URL. |
| capabilities | JSON | defaults to `{transfers: { requested: true }}` |

**Returns:** If successful, resolves to below JSON object. Otherwise, rejects with an error message. The payload also includes the `accountLinkURL` key, which is the result of account link generation.
```js
{
	result: 'OK',
	payload: account,
}
```

**Example:**
```javascript
	const body = {
		email: "...",
		publicDomain: "http://localhost:3000",
		refreshUrlRoute: "/account-authorize",
		returnUrlRoute: "/account-generated",
		capabilities: {transfers: { requested: true }}
	};
	let response = await tsb.generateAccount(body);
```

### completeAccount

Completes a previously started **payee** account (aka connected account) generation at Stripe.

| Parameter | Type | Description |
| --- | --- | --- |
| body | Object | Parameters for the generating a payee account at Stripe |

#### `body`

| Key | Type | Value |
| --- | --- | --- |
| accountId | string | Account id of the account that will continue for setup. |
| publicDomain | String | Public domain of the server, to use the return URLs. |
| refreshUrlRoute | String | Route for the refresh URL. |
| returnUrlRoute | String | Route for the return URL. |

**Returns:** If successful, resolves to below JSON object.
```js
{
	result: 'OK',
	payload: accountLinkURL,
}
```

**Example:**
```javascript
	const body = {
		accountId: "...",
		publicDomain: "http://localhost:3000",
		refreshUrlRoute: "/account-authorize",
		returnUrlRoute: "/account-generated",
	};
	let response = await tsb.completeAccount(body);
```
### paymentSheetHandler

The payment sheet handler is used to generate a payment sheet for the payer customer. The payment sheet is a Stripe object that is used to collect the payment information from the payer customer. The payment sheet is generated by Stripe servers and is returned to the client. The client then uses the payment sheet to collect the payment information from the payer customer. The payment sheet data is to be used by the frontend.

| Parameter | Type | Description |
| --- | --- | --- |
| body | Object | Parameters for the generating a payment sheet at Stripe |

#### `body`

| Key | Type | Value |
| --- | --- | --- |
| customerId | string | Id of the payer customer. |
| payInAmount | number | Amount to be paid by the payer customer. |
| currency | string | Currency of the payment. |
| payoutData | Object | Data for the payee account. If there is no payout action provide ùndefined`. |

###### `payoutData`

| Key | Type | Value |
| --- | --- | --- |
| payoutAmount | number | Amount to be paid to the payee account. |
| payoutAccountId | string | Id of the payee account. |

**Returns:** If successful, resolves to below JSON object. Otherwise, rejects with an error message.
```js
{
	result: 'OK',
	payload: {
		paymentIntent: paymentIntent.client_secret,
		ephemeralKey: ephemeralKey.secret,
		customer: customerId,
		publishableKey: stripePK
	},
}
```

**Example:**
```javascript
	let paymentSheet_ = await tsb.paymentSheetHandler({ customerId, payInAmount, currency });
	let paymentSheet = paymentSheet_.payload;;
```

### refundHandler

Used to refund a payment.

| Parameter | Type | Description |
| --- | --- | --- |
| body | Object | Parameters for the refunding a payment at Stripe |

#### `body`

| Key | Type | Value |
| --- | --- | --- |
| chargeId | string | Id of the charge to be refunded. |

**Returns:** If successful, resolves to below JSON object. Otherwise, rejects with an error message.
```js
{
	result: 'OK',
	payload: refund,
}
```

**Example:**
```javascript
MODIFYME
```

## More Examples

The example application can be found [here](https://github.com/MehmetKaplan/tamed-stripe/blob/master/example/backend).
Also the jest test cases can be used as examples, which can be found [here](https://github.com/MehmetKaplan/tamed-stripe/blob/master/backend/__tests__/tamed-stripe-backend.test.js).

## License

The license is MIT and full text [here](https://github.com/MehmetKaplan/tamed-stripe/blob/master/LICENSE).

#### Used Modules

Please refer to the [main github page](https://github.com/MehmetKaplan/tamed-stripe) for the list of used modules. 