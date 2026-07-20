import {
	Alert,
	Button,
	Container,
	Paper,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { createAuthClient } from 'better-auth/react';
import { useState } from 'react';
import type {
	HeadersFunction,
	LoaderFunctionArgs,
	MetaFunction,
} from 'react-router';
import { redirect, useLoaderData, useNavigate } from 'react-router';
import { getAuthSession } from '@/utils/auth.server';
import { cacheHeaders } from '@/utils/cache';
import { cloudflareContext } from '@/utils/cloudflare-context';

const authClient = createAuthClient();

export const meta: MetaFunction = () => [
	{ title: 'Account | Fontsource' },
	{ name: 'robots', content: 'noindex, nofollow' },
];

export const headers: HeadersFunction = () => cacheHeaders.noStore;

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
	const session = await getAuthSession(
		request,
		context.get(cloudflareContext).env,
	);

	if (!session) {
		return redirect('/login', { headers: cacheHeaders.noStore });
	}

	return {
		name: session.user.name,
		email: session.user.email,
	};
};

export default function Account() {
	const user = useLoaderData<typeof loader>();
	const navigate = useNavigate();
	const [isSigningOut, setIsSigningOut] = useState(false);
	const [hasActionError, setHasActionError] = useState(false);

	const signOut = async () => {
		setHasActionError(false);
		setIsSigningOut(true);

		try {
			const result = await authClient.signOut();

			if (result.error) {
				setHasActionError(true);
				return;
			}

			void navigate('/login');
		} catch {
			setHasActionError(true);
		} finally {
			setIsSigningOut(false);
		}
	};

	return (
		<Container size={480} py={{ base: 48, sm: 80 }}>
			<Paper withBorder p={{ base: 'lg', sm: 'xl' }} radius="md">
				<Stack gap="xl">
					<Title order={1} size="h2" ta="center">
						You're logged in
					</Title>

					{hasActionError && (
						<Alert color="red" title="Something went wrong" role="alert">
							We couldn't sign you out. Please try again.
						</Alert>
					)}

					<Stack gap={4} ta="center">
						<Text fw={600}>{user.name}</Text>
						<Text c="dimmed" size="sm">
							{user.email}
						</Text>
					</Stack>

					<Button variant="default" loading={isSigningOut} onClick={signOut}>
						Sign out
					</Button>
				</Stack>
			</Paper>
		</Container>
	);
}
