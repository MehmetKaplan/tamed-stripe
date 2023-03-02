## Stripe registration

### Stripe related actions

1. Generate your account and get your publishable key and secret key from [here](https://dashboard.stripe.com/register).
2. Make sure you have correct icon, logo, business name, etc from https://dashboard.stripe.com/settings/connect
3. Configure your webhook events from following links
	- Production: https://dashboard.stripe.com/webhooks
	- Test: https://dashboard.stripe.com/test/webhooks
	- Scope for both:
		```
		subscription_schedule.aborted
		subscription_schedule.released
		subscription_schedule.updated
		customer.subscription.paused
		subscription_schedule.created
		person.deleted
		person.updated
		person.created
		payout.paid
		payout.failed
		payout.created
		payout.canceled
		payment_intent.succeeded
		payment_intent.payment_failed
		payment_intent.canceled
		account.updated // sent for all kinds of account updates
		account.external_account.created // sent for bank account
		customer.created
		customer.deleted
		customer.updated
		customer.subscription.created
		customer.subscription.deleted
		```
### Apple Pay

Add `merchantIdentifier` to `app.json` file. You can find it in your Apple Developer account. 

- For production, you should have an account in Apple's accepted banks listed [here](https://support.apple.com/en-us/HT204916).
- For 
  - Live, configure merchant from here: https://developer.apple.com/account/resources/identifiers/add/merchant 
  - Testing, you can use `merchant.com.example` as a placeholder. (As stated [here](https://stripe.com/docs/apple-pay?platform=react-native#testing-apple-pay) stripe will accept any value for the merchant identifier when testing.)

```javascript
{
  "expo": {
    ...
    "plugins": [
      [
        "@stripe/stripe-react-native",
        {
          "merchantIdentifier": "merchant.com.example", // MODIFY THIS FOR PRODUCTION
          "enableGooglePay": false // MODIFY THIS TO ENABLE GOOGLE PAY
        }
      ]
    ],
  }
}
```

### License

The license is MIT and full text [here](https://github.com/MehmetKaplan/tamed-stripe/blob/master/LICENSE).

#### Used Modules

* stripe license [here](./OtherLicenses/stripe.txt)
* fetch-lean license [here](./OtherLicenses/fetch-lean.txt)
* tamed-pg license [here](./OtherLicenses/tamed-pg.txt)
* tick-log license [here](./OtherLicenses/tick-log.txt)