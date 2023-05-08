module.exports = {
	customerExists: "select count(*) as \"count\" from tamedstripe.customers where stripe_customer_id = $1",
	insertCustomer: "insert into tamedstripe.customers (application_customer_id, stripe_customer_id, state, update_time, email, name, phone, address, metadata, checkout_session_id, payment_method_id, customer_object) values ($1, $2, $3, now(), $4, $5, $6, $7, $8, $9, $10, $11) ",
	modifyCustomerPayment: "update tamedstripe.customers set state = $2, update_time = now(), payment_method_id = $3 where stripe_customer_id = $1",
	unlinkCustomer: "update tamedstripe.customers set application_customer_id = null, state = 'U' where stripe_customer_id = $1",
	selectCustomer: "select * from tamedstripe.customers where stripe_customer_id = $1",
	selectCustomer2: "select * from tamedstripe.customers where application_customer_id = $1",
	getCustomer: "select stripe_customer_id, update_time, email, metadata from tamedstripe.customers where application_customer_id = cast($1 as varchar) and state = 'A'",
	insertConnectedAccount: "insert into tamedstripe.connected_accounts (application_customer_id, stripe_account_id, state, update_time, capabilities, email, payment_schedule, account_object) values ($1, $2, $3, now(), $4, $5, $6, $7) ",
	selectAccount: "select * from tamedstripe.connected_accounts where application_customer_id = cast($1 as varchar)",
	getAccount: "select stripe_account_id, state, update_time from tamedstripe.connected_accounts where application_customer_id = cast($1 as varchar)",
	selectAccountForTest: "select * from tamedstripe.connected_accounts where state = 'A' limit 1 ",
	updateConnectedAccount: "update tamedstripe.connected_accounts set state = $2, update_time = now() where stripe_account_id = $1",
	insertPaymentSheet: "insert into tamedstripe.payment_sheets( stripe_customer_id, insert_time, pay_in_amount, currency, payout_stripe_account_id, pay_out_amount, ephemeral_key ) values ($1, now(), $2, $3, $4, $5, $6) ",
	selectPaymentSheets: "select * from tamedstripe.payment_sheets where stripe_customer_id = $1 order by id desc",
	selectProduct: "select * from tamedstripe.products where stripe_product_id = $1",
	insertProduct: "insert into tamedstripe.products (stripe_product_id, name, description, currency, unit_amount_decimal, interval, update_time, product_object, price_object) values ($1, $2, $3, $4, $5, $6, now(), $7, $8) ",
	selectSubscriptionWithProduct: "select * from tamedstripe.subscriptions where stripe_customer_id = $1 and stripe_product_id = $2 and state = 'A'",
	selectSubscription: "select * from tamedstripe.subscriptions where stripe_subscription_id = $1 and state = 'A'",
	insertSubscription: "insert into tamedstripe.subscriptions (stripe_subscription_id, stripe_customer_id, stripe_product_id, description, currency, unit_amount_decimal, interval, update_time, state, subscription_object) values ($1, $2, $3, $4, $5, $6, $7, now(), 'A', $8) ",
	updateSubscription: "update tamedstripe.subscriptions set state = 'C' where stripe_subscription_id = $1",
	insertSubscriptionPayment: "insert into tamedstripe.subscription_payments (stripe_subscription_id, invoice_id, hosted_invoice_url, insert_time, unit_amount_decimal, currency, state, subscription_covered_from, subscription_covered_to, subscription_payment_object) values ($1, $2, $3, now(), $4, $5, $6, $7, $8, $9) ",
	selectSubscriptionPayments: `
		select a.application_customer_id, a.stripe_customer_id, 
				b.stripe_subscription_id, b.stripe_product_id, b.currency, b.unit_amount_decimal, 
				c.insert_time, c.unit_amount_decimal, c.state,
				c.subscription_covered_from, c.subscription_covered_to,
				c.invoice_id, c.hosted_invoice_url
			from tamedstripe.customers a, tamedstripe.subscriptions b, tamedstripe.subscription_payments c
			where a.application_customer_id = cast($1 as varchar)
				and a.stripe_customer_id = b.stripe_customer_id
				and b.state = 'A'
				and b.stripe_subscription_id = c.stripe_subscription_id
				and c.state = 'P'
			order by insert_time desc;
	`,
	selectSubscriptionPaymentsByStripeCustomerId: `
		select a.application_customer_id, a.stripe_customer_id, 
				b.stripe_subscription_id, b.stripe_product_id, b.currency, b.unit_amount_decimal, 
				c.insert_time, c.unit_amount_decimal, c.state,
				c.subscription_covered_from, c.subscription_covered_to,
				c.invoice_id, c.hosted_invoice_url
			from tamedstripe.customers a, tamedstripe.subscriptions b, tamedstripe.subscription_payments c
			where a.stripe_customer_id = $1
				and a.stripe_customer_id = b.stripe_customer_id
				and b.state = 'A'
				and b.stripe_subscription_id = c.stripe_subscription_id
				and c.state = 'P'
			order by insert_time desc;
	`,
	insertOneTimePayment: "insert into tamedstripe.one_time_payments(application_customer_id, stripe_customer_id, checkout_session_id, update_time, total_amount_decimal, currency, state, invoice_id, hosted_invoice_url, payout_amount, payout_account_id, payout_state, items, one_time_payment_object) values ($1, $2, $3, now(), $4, $5, $6, null, null, $7, $8, $9, $10, $11)",
	updateOneTimePayment: "update tamedstripe.one_time_payments set update_time = now(), state = $2, invoice_id = $3, hosted_invoice_url = $4 where checkout_session_id = $1",
	selectOneTimePayment: "select * from tamedstripe.one_time_payments where checkout_session_id = $1",
	refundOneTimePayment1: "update tamedstripe.one_time_payments set state = 'R' where checkout_session_id = $1",
	refundOneTimePayment2: "insert into tamedstripe.one_time_payment_refunds(checkout_session_id, refund_id) values ($1, $2)",
	selectOneTimePaymentRefund: "select * from tamedstripe.one_time_payment_refunds where checkout_session_id = $1",
}
