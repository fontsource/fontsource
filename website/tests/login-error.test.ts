import { describe, expect, it } from 'vitest';

import {
	getOAuthLoginError,
	getSignInNetworkError,
	getSignInRequestError,
	parseSocialProvider,
} from '../app/utils/login-error';

describe('login error messages', () => {
	it('only accepts configured social providers', () => {
		expect(parseSocialProvider('google')).toBe('google');
		expect(parseSocialProvider('github')).toBe('github');
		expect(parseSocialProvider('unknown')).toBeNull();
		expect(parseSocialProvider(null)).toBeNull();
	});

	it('ignores empty OAuth errors', () => {
		expect(getOAuthLoginError(null, 'google')).toBeNull();
		expect(getOAuthLoginError('', 'github')).toBeNull();
	});

	it('explains a cancelled provider flow', () => {
		expect(getOAuthLoginError('access_denied', 'github')).toEqual({
			title: 'GitHub sign-in was cancelled',
			message: 'Try again when you’re ready, or use another sign-in option.',
		});
	});

	it('offers another provider when an email is unavailable', () => {
		expect(getOAuthLoginError('email_not_found', 'google')).toEqual({
			title: 'Google couldn’t verify your email',
			message: 'Use an account with an email address, or continue with GitHub.',
		});
	});

	it('does not expose unknown provider errors', () => {
		const error = getOAuthLoginError('internal_provider_detail', 'google');

		expect(error).toEqual({
			title: 'Google couldn’t complete sign-in',
			message: 'Try Google again, or use another sign-in option.',
		});
		expect(JSON.stringify(error)).not.toContain('internal_provider_detail');
	});

	it('explains rate limiting', () => {
		expect(getSignInRequestError('github', 429)).toEqual({
			title: 'Too many sign-in attempts',
			message: 'Wait a moment, then try GitHub again.',
		});
	});

	it('distinguishes network failures', () => {
		expect(getSignInNetworkError('google')).toEqual({
			title: 'Couldn’t connect to Fontsource',
			message: 'Check your connection and try Google again.',
		});
	});
});
