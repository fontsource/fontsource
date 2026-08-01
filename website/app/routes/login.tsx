import { Alert, Button, Container, Paper, Stack, Title } from '@mantine/core';
import {
	IconAlertCircle,
	IconBrandGithub,
	IconBrandGoogle,
} from '@tabler/icons-react';
import { createAuthClient } from 'better-auth/react';
import { useState } from 'react';
import type {
	HeadersFunction,
	LoaderFunctionArgs,
	MetaFunction,
} from 'react-router';
import { redirect, useSearchParams } from 'react-router';
import { getAuthSession } from '@/utils/auth.server';
import { cacheHeaders } from '@/utils/cache';
import { cloudflareContext } from '@/utils/cloudflare-context';

const authClient = createAuthClient();

type SocialProvider = 'google' | 'github';

type LoginErrorMessage = {
	title: string;
	message: string;
};

const providerLabels: Record<SocialProvider, string> = {
	google: 'Google',
	github: 'GitHub',
};

const getCallbackError = (
	searchParams: URLSearchParams,
): LoginErrorMessage | null => {
	const error = searchParams.get('error');
	if (!error) return null;

	const provider = searchParams.get('provider');
	const providerLabel =
		provider === 'google'
			? providerLabels.google
			: provider === 'github'
				? providerLabels.github
				: null;

	if (error === 'email_not_found') {
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

export const meta: MetaFunction = () => [
	{ title: 'Log in | Fontsource' },
	{ name: 'robots', content: 'noindex, nofollow' },
];

export const headers: HeadersFunction = () => cacheHeaders.noStore;

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
	const session = await getAuthSession(
		request,
		context.get(cloudflareContext).env,
	);

	return session
		? redirect('/account', { headers: cacheHeaders.noStore })
		: null;
};

export default function Login() {
	const [searchParams] = useSearchParams();
	const [pendingProvider, setPendingProvider] = useState<SocialProvider | null>(
		null,
	);
	const [actionError, setActionError] = useState<LoginErrorMessage | null>(
		null,
	);
	const callbackError = pendingProvider ? null : getCallbackError(searchParams);
	const loginError = actionError ?? callbackError;

	const signIn = async (provider: SocialProvider) => {
		setActionError(null);
		setPendingProvider(provider);

		try {
			const result = await authClient.signIn.social({
				provider,
				callbackURL: '/login',
				errorCallbackURL: `/login?provider=${provider}`,
			});

			if (result.error) {
				setActionError(
					result.error.status === 429
						? {
								title: 'Too many sign-in attempts',
								message: 'Wait a moment, then try again.',
							}
						: {
								title: `Fontsource couldn’t start ${providerLabels[provider]} sign-in`,
								message:
									'Try again. If it keeps happening, use another sign-in option.',
							},
				);
			}
		} catch {
			setActionError({
				title: 'Couldn’t connect to Fontsource',
				message: 'Check your connection, then try again.',
			});
		} finally {
			setPendingProvider(null);
		}
	};

	return (
		<Container size={480} py={{ base: 48, sm: 80 }}>
			<Paper withBorder p={{ base: 'lg', sm: 'xl' }} radius="md">
				<Stack gap="xl">
					<Title order={1} size="h2" ta="center">
						Log in to Fontsource
					</Title>

					{loginError && (
						<Alert
							color="red"
							icon={<IconAlertCircle size={20} aria-hidden="true" />}
							radius="md"
							title={loginError.title}
							variant="light"
							role="status"
						>
							{loginError.message}
						</Alert>
					)}

					<Stack gap="sm">
						<Button
							variant="default"
							size="md"
							leftSection={<IconBrandGoogle size={18} aria-hidden="true" />}
							loading={pendingProvider === 'google'}
							disabled={pendingProvider !== null}
							aria-busy={pendingProvider === 'google'}
							onClick={() => void signIn('google')}
						>
							Continue with Google
						</Button>
						<Button
							variant="default"
							size="md"
							leftSection={<IconBrandGithub size={18} aria-hidden="true" />}
							loading={pendingProvider === 'github'}
							disabled={pendingProvider !== null}
							aria-busy={pendingProvider === 'github'}
							onClick={() => void signIn('github')}
						>
							Continue with GitHub
						</Button>
					</Stack>
				</Stack>
			</Paper>
		</Container>
	);
}
