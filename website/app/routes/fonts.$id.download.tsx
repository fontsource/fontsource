import { env } from 'cloudflare:workers';
import { Center, Flex, Loader, Text, Title } from '@mantine/core';
import { useEffect } from 'react';
import type {
	HeadersFunction,
	LoaderFunctionArgs,
	MetaFunction,
} from 'react-router';
import { redirectDocument, useLoaderData, useRevalidator } from 'react-router';
import invariant from 'tiny-invariant';

import styles from '@/components/ErrorBoundary.module.css';
import { throwApiResponseError } from '@/utils/api.server';
import { cacheHeaders } from '@/utils/cache';

export const meta: MetaFunction = () => [
	{ title: 'Preparing download | Fontsource' },
	{ name: 'robots', content: 'noindex, nofollow' },
];

export const headers: HeadersFunction = () => cacheHeaders.noStore;

export const loader = async ({ params }: LoaderFunctionArgs) => {
	const { id } = params;
	invariant(id, 'Missing font ID!');

	const downloadUrl = `https://fontsource-api.fontsource.workers.dev/v1/download/${encodeURIComponent(id)}`;
	const response = await env.API.fetch(downloadUrl);

	if (response.status === 202) {
		await response.body?.cancel();
		return { retryAfter: Number(response.headers.get('Retry-After')) || 3 };
	}

	if (!response.ok) {
		await throwApiResponseError(response, downloadUrl);
	}
	await response.body?.cancel();

	const redirectUrl = new URL(downloadUrl);
	const etag = response.headers.get('ETag');
	if (etag) redirectUrl.searchParams.set('etag', etag);

	return redirectDocument(redirectUrl.toString());
};

export default function Download() {
	const { retryAfter } = useLoaderData<typeof loader>();
	const { revalidate, state } = useRevalidator();

	useEffect(() => {
		if (state !== 'idle') return;

		const timeout = setTimeout(() => {
			void revalidate();
		}, retryAfter * 1000);

		return () => clearTimeout(timeout);
	}, [retryAfter, revalidate, state]);

	return (
		<Center className={styles.container}>
			<Flex align="center" className={styles.content} direction="column">
				<Flex
					align="center"
					className={styles.errorInfo}
					direction="column"
					role="status"
				>
					<Loader size={48} aria-hidden />
					<Title order={1} className={styles.title}>
						Preparing your download
					</Title>
					<Text className={styles.description}>
						New font versions can take up to a minute to prepare. You can keep
						browsing in the original tab and close this tab once the download
						starts.
					</Text>
				</Flex>
			</Flex>
		</Center>
	);
}
