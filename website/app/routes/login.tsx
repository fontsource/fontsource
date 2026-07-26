import { Alert, Button, Container, Paper, Stack, Title } from '@mantine/core';
import {
	IconAlertCircle,
	IconBrandGithub,
	IconBrandGoogle,
} from '@tabler/icons-react';
import { createAuthClient } from 'better-auth/react';
import { useRef, useState } from 'react';
import type {
	HeadersFunction,
	LoaderFunctionArgs,
	MetaFunction,
} from 'react-router';
import { redirect, useSearchParams } from 'react-router';
import { getAuthSession } from '@/utils/auth.server';
import { cacheHeaders } from '@/utils/cache';
import { cloudflareContext } from '@/utils/cloudflare-context';
import {
	getOAuthLoginError,
	getSignInNetworkError,
	getSignInRequestError,
	type LoginErrorMessage,
	parseSocialProvider,
	type SocialProvider,
} from '@/utils/login-error';

const authClient = createAuthClient();

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
	const [hasAttemptedSignIn, setHasAttemptedSignIn] = useState(false);
	const signInInFlight = useRef(false);
	const callbackError = hasAttemptedSignIn
		? null
		: getOAuthLoginError(
				searchParams.get('error'),
				parseSocialProvider(searchParams.get('provider')),
			);
	const loginError = actionError ?? callbackError;

	const signIn = async (provider: SocialProvider) => {
		if (signInInFlight.current) return;

		signInInFlight.current = true;
		setHasAttemptedSignIn(true);
		setActionError(null);
		setPendingProvider(provider);

		try {
			const result = await authClient.signIn.social({
				provider,
				callbackURL: '/login',
				errorCallbackURL: `/login?provider=${provider}`,
			});

			if (result.error) {
				setActionError(getSignInRequestError(provider, result.error.status));
			}
		} catch {
			setActionError(getSignInNetworkError(provider));
		} finally {
			signInInFlight.current = false;
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
