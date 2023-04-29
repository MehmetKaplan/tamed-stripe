const {
	init,
	generateCustomer,
	getCustomer,
	generateProduct,
	generateSubscription,
	getSubscriptionPayments,
	generateAccount,
	getAccount,
	oneTimePayment,
	getOneTimePaymentStatus,
	exportedForTesting,
} = require('./tamed-stripe-frontend-api-callers.js');

const { StripeActionPage } = require('./stripe-action-page');

module.exports = {
	init,
	generateCustomer,
	getCustomer,
	generateProduct,
	generateSubscription,
	getSubscriptionPayments,
	generateAccount,
	getAccount,
	oneTimePayment,
	getOneTimePaymentStatus,
	StripeActionPage: StripeActionPage,
	exportedForTesting,
};
