const stripeOfficialOnboardingMessage = "[COMPANY_NAME] uses Stripe to get you paid quickly and keep your personal and payment information secure. Thousands of companies around the world trust Stripe to process payments for their users. Set up a Stripe account to get paid with [PLATFORM_NAME]."

const keys = {};

let debugMode = false;

const init = (p_params) => new Promise(async (resolve, reject) => {
	try {
		keys.apiBackend = p_params.apiBackend;
		keys.companyName = p_params.companyName;
		keys.platformName = p_params.platformName;
		keys.onboardingMessage = p_params.onboardingMessage
			? p_params.onboardingMessage
			: stripeOfficialOnboardingMessage
				.replace("[COMPANY_NAME]", keys.companyName)
				.replace("[PLATFORM_NAME]", keys.platformName);
		keys.stripePublicKey = p_params.stripePublicKey;
		debugMode = p_params?.debugMode;
		return resolve(true);
	} catch (error) /* istanbul ignore next */ {
		return reject("Unknown error");
	}
});	