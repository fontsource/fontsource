import { type Account, betterAuth } from 'better-auth';

import { cacheHeaders } from './cache';

const discardOAuthTokens = async (account: Partial<Account>) => ({
	data: {
		...account,
		accessToken: null,
		refreshToken: null,
		idToken: null,
	},
});

export const createAuth = (env: Env) =>
	betterAuth({
		database: env.APP_DB,
		baseURL: env.BETTER_AUTH_URL,
		secret: env.BETTER_AUTH_SECRET,
		onAPIError: {
			errorURL: '/login',
		},
		advanced: {
			ipAddress: {
				ipAddressHeaders: ['cf-connecting-ip'],
			},
		},
		emailAndPassword: {
			enabled: false,
		},
		socialProviders: {
			google: {
				clientId: env.GOOGLE_CLIENT_ID,
				clientSecret: env.GOOGLE_CLIENT_SECRET,
			},
			github: {
				clientId: env.GITHUB_CLIENT_ID,
				clientSecret: env.GITHUB_CLIENT_SECRET,
			},
		},
		// Authentication only needs provider identity, not provider credentials.
		databaseHooks: {
			account: {
				create: { before: discardOAuthTokens },
				update: { before: discardOAuthTokens },
			},
		},
	});

export const getAuthSession = (request: Request, env: Env) =>
	createAuth(env).api.getSession({ headers: request.headers });

export const handleAuthRequest = async (request: Request, env: Env) => {
	const response = await createAuth(env).handler(request);
	const headers = new Headers(response.headers);

	for (const [name, value] of Object.entries(cacheHeaders.noStore)) {
		headers.set(name, value);
	}

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
};
