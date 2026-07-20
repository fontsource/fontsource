import { applyD1Migrations } from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { makeSignature } from 'better-auth/crypto';
import { getMigrations } from 'better-auth/db/migration';
import { beforeEach, describe, expect, it } from 'vitest';

import {
	createAuth,
	getAuthSession,
	handleAuthRequest,
} from '../app/utils/auth.server';

const testEnv = env as Env & {
	TEST_MIGRATIONS: Parameters<typeof applyD1Migrations>[1];
};

type StoredTokens = {
	accessToken: string | null;
	refreshToken: string | null;
	idToken: string | null;
};

const readStoredTokens = (accountId: string) =>
	testEnv.APP_DB.prepare(
		'SELECT "accessToken", "refreshToken", "idToken" FROM "account" WHERE "id" = ?',
	)
		.bind(accountId)
		.first<StoredTokens>();

const socialSignIn = (provider: 'google' | 'github', callbackURL = '/login') =>
	handleAuthRequest(
		new Request(`${testEnv.BETTER_AUTH_URL}/api/auth/sign-in/social`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Origin: testEnv.BETTER_AUTH_URL,
			},
			body: JSON.stringify({ provider, callbackURL, disableRedirect: true }),
		}),
		testEnv,
	);

beforeEach(async () => {
	await applyD1Migrations(testEnv.APP_DB, testEnv.TEST_MIGRATIONS);
});

describe('account database', () => {
	it('has no pending Better Auth table or column migrations', async () => {
		const { toBeCreated, toBeAdded } = await getMigrations(
			createAuth(testEnv).options,
		);

		expect(toBeCreated).toEqual([]);
		expect(toBeAdded).toEqual([]);
	});

	it('does not persist provider tokens', async () => {
		const context = await createAuth(testEnv).$context;
		const user = await context.internalAdapter.createUser({
			name: 'Test User',
			email: 'test@example.com',
			emailVerified: true,
		});
		const account = await context.internalAdapter.createAccount({
			accountId: 'provider-account-id',
			providerId: 'google',
			userId: user.id,
			accessToken: 'plaintext-access-token',
			refreshToken: 'plaintext-refresh-token',
			idToken: 'plaintext-id-token',
		});

		expect(account).not.toBeNull();
		if (!account) throw new Error('Account was not created');

		const created = await readStoredTokens(account.id);
		expect(created).toEqual({
			accessToken: null,
			refreshToken: null,
			idToken: null,
		});

		await context.internalAdapter.updateAccount(account.id, {
			accessToken: 'replacement-access-token',
			refreshToken: 'replacement-refresh-token',
			idToken: 'replacement-id-token',
		});
		const updated = await readStoredTokens(account.id);
		expect(updated).toEqual({
			accessToken: null,
			refreshToken: null,
			idToken: null,
		});
	});
});

describe('account endpoints', () => {
	it('returns an uncached empty session before sign in', async () => {
		const response = await handleAuthRequest(
			new Request(`${testEnv.BETTER_AUTH_URL}/api/auth/get-session`),
			testEnv,
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toBeNull();
		expect(response.headers.get('Cache-Control')).toBe('no-store');
		expect(response.headers.get('CDN-Cache-Control')).toBe('no-store');
		expect(response.headers.get('Cloudflare-CDN-Cache-Control')).toBe(
			'no-store',
		);
	});

	it('reads an authenticated session from the request cookie', async () => {
		const auth = createAuth(testEnv);
		const context = await auth.$context;
		const user = await context.internalAdapter.createUser({
			name: 'Session User',
			email: 'session@example.com',
			emailVerified: true,
		});
		const session = await context.internalAdapter.createSession(user.id);
		const signedToken = `${session.token}.${await makeSignature(
			session.token,
			context.secret,
		)}`;
		const request = new Request(`${testEnv.BETTER_AUTH_URL}/login`, {
			headers: {
				Cookie: `${context.authCookies.sessionToken.name}=${signedToken}`,
			},
		});

		const authenticatedSession = await getAuthSession(request, testEnv);

		expect(authenticatedSession?.user).toMatchObject({
			id: user.id,
			name: 'Session User',
			email: 'session@example.com',
		});
	});

	it.each([
		['google', 'accounts.google.com'],
		['github', 'github.com'],
	] as const)(
		'starts %s OAuth on the configured origin',
		async (provider, host) => {
			const response = await socialSignIn(provider);
			const body = (await response.json()) as {
				url: string;
				redirect: boolean;
			};
			const authorizationURL = new URL(body.url);

			expect(response.status).toBe(200);
			expect(body.redirect).toBe(false);
			expect(authorizationURL.host).toBe(host);
			expect(authorizationURL.searchParams.get('redirect_uri')).toBe(
				`${testEnv.BETTER_AUTH_URL}/api/auth/callback/${provider}`,
			);
		},
	);

	it('rejects callback URLs outside Fontsource', async () => {
		const response = await socialSignIn('google', 'https://example.com/login');

		expect(response.status).toBe(403);
	});
});
