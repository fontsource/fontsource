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

	if (code === 'email_not_found') {
		const alternateProvider =
			provider === 'google'
				? providerLabels.github
				: provider === 'github'
					? providerLabels.google
					: null;

		return {
			title: providerLabel
				? `${providerLabel} didn’t share an email address`
				: 'No email address was provided',
			message: alternateProvider
				? `Fontsource needs an email address to complete sign-in. Try an account that shares one, or continue with ${alternateProvider}.`
				: 'Fontsource needs an email address to complete sign-in. Try an account that shares one, or use another sign-in option.',
		};
	}

	return {
		title: providerLabel
			? `${providerLabel} couldn’t complete sign-in`
			: 'Couldn’t log you in',
		message: 'Try again. If it keeps happening, use another sign-in option.',
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
			message: 'Wait a moment, then try again.',
		};
	}

	return {
		title: `Fontsource couldn’t start ${providerLabel} sign-in`,
		message: 'Try again. If it keeps happening, use another sign-in option.',
	};
};

export const getSignInNetworkError = (): LoginErrorMessage => ({
	title: 'Couldn’t connect to Fontsource',
	message: 'Check your connection, then try again.',
});
