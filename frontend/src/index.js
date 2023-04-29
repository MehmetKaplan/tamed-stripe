import {
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
} from './tamed-stripe-frontend-api-callers.js';

import { StripeActionPage } from './stripe-action-page';

export default {
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
