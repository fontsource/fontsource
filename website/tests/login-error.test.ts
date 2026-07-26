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

	it('does not assume why a provider denied access', () => {
		expect(getOAuthLoginError('access_denied', 'github')).toEqual({
			title: 'GitHub couldn’t complete sign-in',
			message: 'Try again. If it keeps happening, use another sign-in option.',
		});
	});

	it('explains why an email address is required', () => {
		expect(getOAuthLoginError('email_not_found', 'google')).toEqual({
			title: 'Google didn’t share an email address',
			message:
				'Fontsource needs an email address to complete sign-in. Try an account that shares one, or continue with GitHub.',
		});
	});

	it('does not expose unknown provider errors', () => {
		const error = getOAuthLoginError('internal_provider_detail', 'google');

		expect(error).toEqual({
			title: 'Google couldn’t complete sign-in',
			message: 'Try again. If it keeps happening, use another sign-in option.',
		});
		expect(JSON.stringify(error)).not.toContain('internal_provider_detail');
	});

	it('explains rate limiting', () => {
		expect(getSignInRequestError('github', 429)).toEqual({
			title: 'Too many sign-in attempts',
			message: 'Wait a moment, then try again.',
		});
	});

	it('distinguishes network failures', () => {
		expect(getSignInNetworkError()).toEqual({
			title: 'Couldn’t connect to Fontsource',
			message: 'Check your connection, then try again.',
		});
	});
});
