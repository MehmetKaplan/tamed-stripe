## Stripe registration

1. Generate your account and get your publishable key and secret key from [here](https://dashboard.stripe.com/register).
2. Make sure you have correct icon, logo, business name, etc from https://dashboard.stripe.com/settings/connect
3. Configure your webhook events from following links
	- Production: https://dashboard.stripe.com/webhooks
	- Test: https://dashboard.stripe.com/test/webhooks
	- Scope for both:
    	- Account webhook
			```
			subscription_schedule.updated
			invoice.paid
			payout.failed
			payout.paid
			checkout.session.async_payment_failed
			checkout.session.async_payment_succeeded
			checkout.session.completed
			checkout.session.expired
			payment_intent.succeeded
			account.updated
			```
		- Connect webhook
			```
			account.updated
			```
4. Before production, you'll need your Stripe account to be approved. You can do this by following [this link](https://stripe.com/docs/connect/testing#testing-account-approval).


### Sub libraries

- [DB setup](https://github.com/MehmetKaplan/tamed-stripe/blob/master/database-setup/README.md)
- [tamed-stripe-backend](https://github.com/MehmetKaplan/tamed-stripe/blob/master/backend/README.md)
- [tamed-stripe-frontend](https://github.com/MehmetKaplan/tamed-stripe/blob/master/frontend/README.md)


### License

The license is MIT and full text [here](https://github.com/MehmetKaplan/tamed-stripe/blob/master/LICENSE).

#### Used Modules

* stripe license [here](./OtherLicenses/stripe.txt)
* fetch-lean license [here](./OtherLicenses/fetch-lean.txt)
* tamed-pg license [here](./OtherLicenses/tamed-pg.txt)
* tick-log license [here](./OtherLicenses/tick-log.txt)