export type SocialProvider = 'google' | 'github';

export type LoginErrorMessage = {
	title: string;
	message: string;
};

const providerLabels: Record<SocialProvider, string> = {
	google: 'Google',
	github: 'GitHub',
};

export const parseSocialProvider = (
	provider: string | null,
): SocialProvider | null =>
	provider === 'google' || provider === 'github' ? provider : null;

export const getOAuthLoginError = (
	errorCode: string | null,
	provider: SocialProvider | null,
): LoginErrorMessage | null => {
	const code = errorCode?.trim().toLowerCase();
	if (!code) return null;

	const providerLabel = provider ? providerLabels[provider] : null;

	if (code === 'access_denied') {
		return {
			title: providerLabel
				? `${providerLabel} sign-in was cancelled`
				: 'Sign-in was cancelled',
			message: 'Try again when you’re ready, or use another sign-in option.',
		};
	}

	if (code === 'email_not_found') {
		const alternateProvider =
			provider === 'google'
				? providerLabels.github
				: provider === 'github'
					? providerLabels.google
					: null;

		return {
			title: providerLabel
				? `${providerLabel} couldn’t verify your email`
				: 'Your email couldn’t be verified',
			message: alternateProvider
				? `Use an account with an email address, or continue with ${alternateProvider}.`
				: 'Use an account with an email address, or try another sign-in option.',
		};
	}

	return {
		title: providerLabel
			? `${providerLabel} couldn’t complete sign-in`
			: 'Couldn’t log you in',
		message: providerLabel
			? `Try ${providerLabel} again, or use another sign-in option.`
			: 'Try again, or use another sign-in option.',
	};
};

export const getSignInRequestError = (
	provider: SocialProvider,
	status?: number,
): LoginErrorMessage => {
	const providerLabel = providerLabels[provider];

	if (status === 429) {
		return {
			title: 'Too many sign-in attempts',
			message: `Wait a moment, then try ${providerLabel} again.`,
		};
	}

	return {
		title: `Couldn’t start ${providerLabel} sign-in`,
		message: `Try ${providerLabel} again, or use another sign-in option.`,
	};
};

export const getSignInNetworkError = (
	provider: SocialProvider,
): LoginErrorMessage => ({
	title: 'Couldn’t connect to Fontsource',
	message: `Check your connection and try ${providerLabels[provider]} again.`,
});
