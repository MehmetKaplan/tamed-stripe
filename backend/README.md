## WHY?

This is the backend library for the Tamed Stripe architecture. This library aims to provide the backend integrations with the Stripe API servers for basic customer generation, connected account generation, subscription generation and payment functions.

## SETUP

1. Add the backend library to the backend of your project.

```bash
yarn add tamed-stripe-backend
```

2. Modify the `TAMED_STRIPE_SECRET_KEY` environment parameter to use to connect to the Stripe.

```bash
export TAMED_STRIPE_SECRET_KEY="YOUR_STRIPE_SECRET_KEY" # starts with sk_

```

3.  Initialize parameters (modify below object according to your environment)

	Use [this file](https://github.com/MehmetKaplan/tamed-stripe/blob/master/example/backend/server-parameters.js) as a template for your backend configuration. This file is to be `require`d by your express server in the next step. **You should modify the credentials, according to your environment.**

	| Key | Type | Value |
	| --- | --- | --- |
	| pgKeys | Object | PostgreSQL connection parameters. |
	| debugMode | Boolean | If `true`, the library will log debug messages. |
	
4. Call the `init` function of the library to initialize the db connection pool. And then start your server. As a reference you can use [this file](https://github.com/MehmetKaplan/tamed-stripe/blob/master/example/backend/server.js) which utilize the [tamed-express-server](https://www.npmjs.com/package/tamed-express-server) library for a quick start.

## API

### init

The `init` function initializes the database connection pool. Additionally it provides a method to increase the log level.

| Parameter | Type | Description |
| --- | --- | --- |
| p_params | Object | Parameters for the backend server. |

#### p_params

| Key | Type | Value |
| --- | --- | --- |
| pgKeys | Object | PostgreSQL connection parameters. |
| debugMode | Boolean | If `true`, the library will log debug messages. |

#### Returns

If successful, resolves to `true`. Otherwise, rejects with an error message.

#### Example

```javascript
const tsb = require("../tamed-stripe-backend.js");
...
await tsb.init({
	debugMode: debugMode,
	// coming from database-setup
	pgKeys: {
		user: 'tamedstripeapp',
		password: 'tamedstripeapp.',
		database: 'tamedstripedb',
		host: 'localhost',
		port: 5432,
	},
});
```

### generateCustomer

Generates a **payer** customer at Stripe and attaches a payment method to it so that the customer can do payments. 

#### Reading Data from Database

Once a customer is generated, you can reach the customer within your database from the `tamedstripe.customers` table. The `application_customer_id` field of the `tamedstripe.customers` table is the `applicationCustomerId` parameter of this function. You can use this field to link your application's customer structure with the Stripe side customer id.

| Parameter | Type | Description |
| --- | --- | --- |
| body | Object | Parameters for the generating a payer customer at Stripe |

#### body

| Key | Type | Value |
| --- | --- | --- |
| applicationCustomerId | string | This is your application's customer id that you can use to link your application customer structure with stripe side customer id. |
| paymentMethodId<br>(optional) | string | Payment method id of the payment method to be attached to the customer. If this is omitted a new payment method will be generated with a checkout session. |
| description | string | Description of the customer. |
| email | string | Email of the customer. |
| metadata | Object | Metadata for the customer, you can embed andy data within this object, it is kept in Stripe servers also. |
| name | string | Name of the customer. |
| phone | string | Phone number of the customer. |
| address | Object | Address of the customer. |
| publicDomain | string | Public domain of the website. |
| successRoute | string | Route to redirect to on successful checkout. Defaults to `/generate-customer-success-route` which is handled by the library function `generateCustomerSuccessRoute`. We suggest you to keep this as undefined and use the default value because the default value signals frontend a method to close WebViews. |
| cancelRoute | string | Route to redirect to on cancelled checkout. Defaults to `/generate-customer-cancel-route` which is handled by the library function `generateCustomerCancelRoute`. We suggest you to keep this as undefined and use the default value because the default value signals frontend a method to close WebViews. |
| testClockId<br>(optional) | string | This is an optional clock id that is a method that Stripe provides for future dated tests. For an example usage, you can refer to [subscriptionPayment - next 2 months](./__tests__/tamed-stripe-backend-STEP_4.test.js) tests. |

###### address

| Key | Type | Value |
| --- | --- | --- |
| city | string | City of the customer. |
| country | string | Country of the customer. |
| line1 | string | Line 1 of the address of the customer. |
| line2 | string | Line 2 of the address of the customer. |
| postal_code | string | Postal code of the customer. |
| state | string | State of the customer. |

#### Returns

If successful, resolves to below JSON object. The checkoutSession object is optional and it holds the checkout session information which can be used to collect the default payment method information from users. Otherwise, rejects with an error message.
```js
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
   ...
	const body = { applicationCustomerId, description, email, metadata, name, phone, address, publicDomain };
	let response = await tsb.generateCustomer(body);
```

### generateCustomerSuccessRoute

This is the default route handler for the `generateCustomer` handler. This is used if the `successRoute` parameter of the `generateCustomer` handler is a falsy value. We suggest you to use this handler because the redirect signals frontend a method to close WebViews.

### generateCustomerCancelRoute

This is the default route handler for the `generateCustomer` handler. This is used if the `cancelRoute` parameter of the `generateCustomer` handler is a falsy value. We suggest you to use this handler because the redirect signals frontend a method to close WebViews, and it also unlinks a customer so that it can not provide hurdles for future operations.

### getCustomer

Gets stripe customer information from the database, using the `applicationCustomerId` parameter.

| Parameter | Type | Description |
| --- | --- | --- |
| body | Object | Parameters for the generating a payer customer at Stripe |

#### body

| Key | Type | Value |
| --- | --- | --- |
| applicationCustomerId | string | This is your application's customer id that you can use to link your application customer structure with stripe side customer id. |

#### Returns

If successful, resolves to below JSON object. Otherwise, rejects with an error message.
```js
{
	result: 'OK',
	payload: {
		customer // customer.rows[0] from DB with selected columns
	},
}
```

#### Example

```javascript
   ...
	const body = { applicationCustomerId };
	let response = await tsb.getCustomer(body);
```

### generateProduct

Generates a product that can be used in checkout sessions that is to be a basis for subscriptions. Once a product is generated, you can reach the product within your database from the `tamedstripe.products` table. The `stripe_product_id` field of the `tamedstripe.products` table is the Stripe's product id.

| Parameter | Type | Description |
| --- | --- | --- |
| body | Object | Parameters for the generating a payer customer at Stripe |

#### body

| Key | Type | Value |
| --- | --- | --- |
| name | string | Name of the product. |
| description | string | Description of the product. |
| currency | string | Currency of the product. |
| unitAmountDecimal | number | Unit amount of the product **in CENTS**. |
| interval | string | Interval of the product. This can be one of following values; `'day'`, `'week'`, `'month'`, `'year'`. |


#### Returns

If successful, resolves to below JSON object. Otherwise, rejects with an error message.
```js
{
	result: 'OK',
	payload: {
		product,
		price
	},
}
```

#### Example

```javascript
	const body = {
		name: 'Test Product',
		description: 'Test Product Description',
		currency: 'usd',
		unitAmountDecimal: 1000, // This value is in cents, so it is $10.00, 
		interval: 'month',
	};
	let response = await tsb.generateProduct(body);
```

### generateSubscription

Generates a subscription for a customer. Once a subscription is generated, you can reach the subscription within your database from the `tamedstripe.subscriptions` table. The `stripe_subscription_id` field of the `tamedstripe.subscriptions` table is the Stripe's subscription id. The `stripe_product_id` field of the `tamedstripe.subscriptions` table is the Stripe's product id. The `state` field can be one of following values; `'A'` (active), `'C'`(cancelled). As long as a subscription is active the Stripe will charge the customer automatically.

#### Reading Data from Database

Once Stripe charges a customer for a subscription, it is received via a `'invoice.paid'` web hook. And when that webhook indicating a successfull payment is made, `tamedstripe.subscription_payments` table is modified accordingly. In this table you can check if current date-time is between the `subscription_covered_from` and `subscription_covered_to` fields of any row of the same subscription's payments. If it is, then the subscription is covered for that period. If it is not, then the subscription is not covered for that period. You can use this information to determine if a subscription is covered for a period or not and serve your functionality to your customer.

For example below row from the `tamedstripe.subscription_payments` table indicates that the subscription is covered for the period between `2023-03-23 14:36:36` and `2023-04-23 14:36:36`. So if you want to check if a subscription is covered for the current date-time, you can check if the current date-time is between `2023-03-23 14:36:36` and `2023-04-23 14:36:36`. If it is, then the subscription is covered for that period. If it is not, then the subscription is not covered for that period.

```sql
 id |    stripe_subscription_id    | unit_amount_decimal | currency | state | subscription_covered_from | subscription_covered_to 
----+------------------------------+---------------------+----------+-------+---------------------------+-------------------------
  1 | sub_1MopFoCDKfcpGwAfZiZTD1Gg |              100001 | usd      | P     | 2023-03-23 14:36:36       | 2023-04-23 14:36:36
```

| Parameter | Type | Description |
| --- | --- | --- |
| body | Object | Parameters for the generating a subscription at Stripe |

#### body

| Key | Type | Value |
| --- | --- | --- |
| customerId | string | Stripe customer id that the subscription will be generated for. |
| recurringPriceId | string | Stripe price id of the recurring price, which should be previously generated using `generateProduct` function. |
| description | string | Description of the subscription. |

#### Returns

If successful, resolves to below JSON object. Otherwise, rejects with an error message.
```javascript
{
	result: 'OK',
	payload: subscription,
}
```

**Example**
```javascript
const productProps = {
	name: 'Test',
	description: 'Test',
	currency: 'usd',
	unitAmountDecimal: '1234567', // This value is in cents, so it is $12345,67,
	interval: 'month',
};
const response2 = await tsb.generateProduct(productProps);
const priceData = response2.payload.price;
...
await tsb.generateSubscription({
	applicationCustomerId: applicationCustomerId,
	recurringPriceId: priceData.id,
	description: description,
});

```

### getSubscriptionPayments

Gets the payments of an application customer id for all subscriptions. The retrieved list can be filtered to find the needed payments.

| Parameter | Type | Description |
| --- | --- | --- |
| body | Object | Parameters for the generating a payer customer at Stripe |

#### body

| Key | Type | Value |
| --- | --- | --- |
| applicationCustomerId | string | Application customer id of the customer that the subscription payments will be retrieved for. |

#### Returns

If successful, resolves to below JSON object. Otherwise, rejects with an error message.
```js
{
	result: 'OK',
	payload: subscriptionPayments,
}
```

**Example**
```javascript
const response = await tsb.getSubscriptionPayments({
	applicationCustomerId: applicationCustomerId,
});
```

### cancelSubscription

Cancels a subscription.

| Parameter | Type | Description |
| --- | --- | --- |
| body | Object | Parameters for the generating a payer customer at Stripe |

#### body

| Key | Type | Value |
| --- | --- | --- |
| subscriptionId | string | Id of the subscription to be cancelled. |

#### Returns

If successful, resolves to below JSON object where `subscription` object is coming from Stripe. Otherwise, rejects with an error message.
```js
{
	result: 'OK',
	payload: subscription,
}
```

#### Example

```javascript
	const body = {
		subscriptionId: 'sub_1234567890',
	};
	let response = await tsb.cancelSubscription(body);
```
### generateAccount

Generates a **payee** account (aka connected account) at Stripe and its associated account link for the end user to complete the account generation process on Stripe.

The account link is generated for the end user to complete the account generation process on Stripe. The end user should be redirected to the Stripe's website to complete the account generation process using the returned link. After the account generation process is completed, the end user will be redirected to the return URL of the account link. 

#### Reading Data from Database

The connected account information for a customer is kept in the `tamedstripe.connected_accounts` table. In this table `application_customer_id` is the customer id of your system and it is to be used to link your software to the generated `application_customer_id`. The `state` field can be either `'W'` or `A`. `W` means the account is waiting for the end user to complete the account generation process on Stripe. `'A'` means the account is active and ready to be used. For `'W'` rows, you can re-call this function to recieeve an active URL that you can use to direct your users to complete their account generation process on Stripe.


| Parameter | Type | Description |
| --- | --- | --- |
| body | Object | Parameters for the generating a payee account at Stripe |

#### body

| Key | Type | Value |
| --- | --- | --- |
| applicationCustomerId | string | Id of the application customer that the account will be generated for. |
| email | string | Email of the account. |
| publicDomain | String | Public domain of the server, to use the return URLs. |
| refreshUrlRoute | String | Route for the refresh URL. Defaults to `/generate-account-cancel-route` for which the route can be handled by this library.|
| returnUrlRoute | String | Route for the return URL. Defaults to `/generate-account-success-route` for which the route can be handled by this library.|
| country | String | Country of the account. Defaults to `US`. |
| capabilities | JSON | Defaults to `{transfers: { requested: true }}` |

#### Returns

You should expect 3 different responses from this function.

- If there is a successfully generated account for the given `applicationCustomerId`, then the response will be as below, and the  `payload.id` can be used as Stripe side payee (`connected_account`) `id`.
```javascript
{
	result: 'OK',
	payload: {
		id: result.rows[0].stripe_account_id,
		accountLinkURL: ''
	}
}
```
- If previously account generation process started but the end user did not complete the process, then the response will be as below, and the `payload.accountLinkURL` can be used to redirect the end user to the Stripe's website to complete the account generation process. Use the `accountLinkURL` field to redirect the end user to the Stripe's website to complete the account generation process.
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
- If there is no account for the given `applicationCustomerId`, then the response will be as below, and the `payload.accountLinkURL` can be used to redirect the end user to the Stripe's website to start the account generation process.
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
const props = {
	applicationCustomerId,
	email,
	publicDomain,
	country,
};
const response1 = await tsb.generateAccount(props);
```

### generateAccountSuccessRoute

Provides the default route content for th `/generate-account-success-route` route. This route is used to handle the return URL of the account link. The default route content can be used as is, or you can use it as a template to create your own route content.

### generateAccountCancelRoute

Provides the default route content for th `/generate-account-cancel-route` route. This route is used to handle the refresh URL of the account link. The default route content can be used as is, or you can use it as a template to create your own route content.

### getAccount

Gets the account information for the given `applicationCustomerId`.

| Parameter | Type | Description |
| --- | --- | --- |
| body | Object | Parameters for the generating a payee account at Stripe |

#### body

| Key | Type | Value |
| --- | --- | --- |
| applicationCustomerId | string | Id of the application customer that the account will be generated for. |

#### Returns

If successful, resolves to below JSON object. Otherwise, rejects with an error message.

```js
{
	result: 'OK',
	payload: account, // account.rows[0] from DB with selected columns
}
```

#### Example

```javascript
	const response2 = await tsb.getAccount({applicationCustomerId});
```


### oneTimePayment

Generates a one time payment checkout session at Stripe. You can use that session URL to direct your users to the Stripe's website to complete the payment process.

#### Reading Data from Database

The payment data is kept in the `tamedstripe.one_time_payments` table. In this table `application_customer_id` is the customer id of your system and it is to be used to link your software to the generated `checkout_session_id`. The `state` field can be either `'W'`, `'P'` or `F`. `W` means the payment is waiting for the end user to complete the payment process on Stripe. `'P'` means the payment is completed. `'F'` means payment is failed.

Additionally, for successfully paid customers, if you need to show your customer the related invoice, you can call the url residing in the `hosted_invoice_url` field.

| Parameter | Type | Description |
| --- | --- | --- |
| body | Object | Parameters for the generating a one time payment checkout session at Stripe |

#### body

| Key | Type | Value |
| --- | --- | --- |
| applicationCustomerId | string | Id of the application customer that the payment will be generated for. |
| currency | string | Currency of the payment. |
| items | Array | Array of items to be paid. |
| payoutData | Object | Payout data for the payment. |
| publicDomain | String | Public domain of the server, to use the return URLs. |


##### items

| Key | Type | Value |
| --- | --- | --- |
| name | string | Name of the item. |
| amount | string | Amount of the item, in cents. |

##### payoutData

| Key | Type | Value |
| --- | --- | --- |
| payoutAmount | string | Amount to be paid to the payee, in cents. |
| payoutAccountId | string | Stripe account id of the payee. |

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
const currency = 'eur';
const items = [
	{ name: "iPhone", unitAmountDecimal: "100000" },
	{ name: "iPad", unitAmountDecimal: "150000" },
	{ name: "iMac", unitAmountDecimal: "200000" },
];
const payoutData = {
	payoutAmount: "225000",
	payoutAccountId: "some-account-id-who-will-receive-the-payment",
	useOnBehalfOf: true
};
const props = {
	applicationCustomerId,
	currency,
	items,
	payoutData,
	publicDomain,
};
const response3 = await tsb.oneTimePayment(props);
```

### oneTimePaymentSuccessRoute

Provides the default route content for th `/one-time-payment-success-route` route. This route is used to handle the return URL of the checkout session. The default route content can be used as is, or you can use it as a template to create your own route content. We suggest to use this route because it helps to manage the frontend application web view state.

### oneTimePaymentCancelRoute

Provides the default route content for th `/one-time-payment-cancel-route` route. This route is used to handle the refresh URL of the checkout session. The default route content can be used as is, or you can use it as a template to create your own route content. We suggest to use this route because it helps to manage the frontend application web view state.

### getOneTimePaymentStatus

Returns the status of a one time payment.

| Parameter | Type | Description |
| --- | --- | --- |
| body | Object | Parameters for the generating a one time payment checkout session at Stripe |

#### body

| Key | Type | Value |
| --- | --- | --- |
| checkoutSessionId | string | Id of the checkout session. |

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
 
### refundOneTimePayment

Refunds a **completed** one time payment using the checkout session id.

| Parameter | Type | Description |
| --- | --- | --- |
| body | Object | The object that holds the parmeters |


#### body

| Key | Type | Value |
| --- | --- | --- |
| checkoutSessionId | string | Id of the checkout session. |

#### Returns

The `payload` holds the refund object coming from Stripe.
```javascript
{
	result: 'OK',
	payload: refund,
}
```

#### Example

```javascript
const checkoutSessionIdToRefund = "cs_XXX"; // completed checkout session id of the payment to be refunded
await tsb.refundOneTimePayment({ checkoutSessionId: checkoutSessionIdToRefund });
```

### webhook

This is a webhook endpoint that can be used to handle the Stripe events. The events are directed to different functions.

This library handles following events

| Event | Function | Description |
| --- | --- | --- |
| `checkout.session.completed` | `webhookCheckoutSessionCompletedSetup` or `webhookCheckoutSessionCompletedPayment` | Stripe sends this event when <br> a checkout session for a new customer payment method is completed <br> or when a one time payment is done. This library checks the `event.data.object.mode` parameter to differentiate these 2 events. |
| `invoice.paid` | `webhookSubscriptionInvoicePaid` | We use this event to detect subscription payments. For this purpose we check if the `event.data.object.billing_reason` field is subscription related or not. (If it is not subscription related, it is ignored.) |
| `account.updated` | `webhookAccountUpdated` | We use this event to detect connected account updates. And we check the `event.data.object.charges_enabled` and the `event.data.object.payouts_enabled` parameters to decide if the connected account is successfully generated or not. |

## Using the data in the DB

The tamed-stripe libraries provide the fundamental functionalities connecting to the Stripe. However, if there is no change at Stripe, the data in the database can be used to get latest state of the customers, connected accounts, subscriptions and payments without calling Stripe.

For these purposes we suggest to familiarize yourself with the database structure. The ERD of the database can be found below.

![ERD](https://raw.githubusercontent.com/MehmetKaplan/tamed-stripe/master/database-setup/ERD.png)


## More Examples

The example application can be found [here](https://github.com/MehmetKaplan/tamed-stripe/blob/master/example/backend).
Also the jest test cases can be used as examples, which can be found [here](https://github.com/MehmetKaplan/tamed-stripe/blob/master/backend/__tests__/).

## License

The license is MIT and full text [here](https://github.com/MehmetKaplan/tamed-stripe/blob/master/LICENSE).

#### Used Modules

Please refer to the [main github page](https://github.com/MehmetKaplan/tamed-stripe) for the list of used modules. 