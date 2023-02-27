1. From https://developer.apple.com/account/resources/identifiers/list/merchant, generated `merchant.one.eseme.stripetest`
2. Go to `https://dashboard.stripe.com/webhooks` (for production), `https://dashboard.stripe.com/test/webhooks` (for test) and configure the webhook route. (The route should be an `https` route. 
	- subscription_schedule.aborted
	- subscription_schedule.released
	- subscription_schedule.updated
	- customer.subscription.paused
	- subscription_schedule.created
	- person.deleted
	- person.updated
	- person.created
	- payout.paid
	- payout.failed
	- payout.created
	- payout.canceled
	- payment_intent.succeeded
	- payment_intent.payment_failed
	- payment_intent.canceled
	- account.updated
	- customer.created
	- customer.deleted
	- customer.updated
	- customer.subscription.created

