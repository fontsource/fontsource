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

type SocialProvider = 'google' | 'github';

const signInErrorMessage =
	'Please try again, or choose another sign-in option.';

export default function Login() {
	const [searchParams] = useSearchParams();
	const [pendingProvider, setPendingProvider] = useState<SocialProvider | null>(
		null,
	);
	const [hasActionError, setHasActionError] = useState(false);
	const hasError = hasActionError || searchParams.has('error');

	const signIn = async (provider: SocialProvider) => {
		setHasActionError(false);
		setPendingProvider(provider);

		try {
			const result = await authClient.signIn.social({
				provider,
				callbackURL: '/login',
				errorCallbackURL: '/login',
			});

			if (result.error) {
				setHasActionError(true);
			}
		} catch {
			setHasActionError(true);
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

					{hasError && (
						<Alert
							color="red"
							icon={<IconAlertCircle size={20} aria-hidden="true" />}
							radius="md"
							title="Couldn't log you in"
							variant="light"
							role="alert"
						>
							{signInErrorMessage}
						</Alert>
					)}

					<Stack gap="sm">
						<Button
							variant="default"
							size="md"
							leftSection={<IconBrandGoogle size={18} aria-hidden="true" />}
							loading={pendingProvider === 'google'}
							disabled={pendingProvider !== null}
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
