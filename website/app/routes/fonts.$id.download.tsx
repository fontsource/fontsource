import { env } from 'cloudflare:workers';
import { Button, Center, Flex, Loader, Text, Title } from '@mantine/core';
import { IconCircleCheck } from '@tabler/icons-react';
import { useEffect, useRef } from 'react';
import type {
	HeadersFunction,
	LoaderFunctionArgs,
	MetaFunction,
} from 'react-router';
import { useLoaderData, useRevalidator } from 'react-router';
import invariant from 'tiny-invariant';

import styles from '@/components/ErrorBoundary.module.css';
import { throwApiResponseError } from '@/utils/api.server';
import { cacheHeaders } from '@/utils/cache';

export const meta: MetaFunction = () => [
	{ title: 'Preparing Download | Fontsource' },
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
		return {
			state: 'building' as const,
			retryAfter: Number(response.headers.get('Retry-After')) || 3,
		};
	}

	if (!response.ok) {
		await throwApiResponseError(response, downloadUrl);
	}
	await response.body?.cancel();

	const redirectUrl = new URL(downloadUrl);
	const etag = response.headers.get('ETag');
	if (etag) redirectUrl.searchParams.set('etag', etag);

	return { state: 'ready' as const, downloadUrl: redirectUrl.toString() };
};

export default function Download() {
	const download = useLoaderData<typeof loader>();
	const { revalidate, state } = useRevalidator();
	const startedDownload = useRef(false);

	useEffect(() => {
		if (download.state === 'ready') {
			if (startedDownload.current) return;

			startedDownload.current = true;
			window.location.replace(download.downloadUrl);
			return;
		}

		if (state !== 'idle') return;

		const timeout = setTimeout(() => {
			void revalidate();
		}, download.retryAfter * 1000);

		return () => clearTimeout(timeout);
	}, [download, revalidate, state]);

	const isReady = download.state === 'ready';

	return (
		<Center className={styles.container}>
			<Flex align="center" className={styles.content} direction="column">
				<Flex
					align="center"
					className={styles.errorInfo}
					direction="column"
					role="status"
				>
					{isReady ? (
						<IconCircleCheck
							aria-hidden
							color="var(--mantine-color-green-6)"
							size={56}
							stroke={1.75}
						/>
					) : (
						<Loader size={48} aria-hidden />
					)}
					<Title order={1} className={styles.title}>
						{isReady ? 'Your download is ready' : 'Preparing your download'}
					</Title>
					<Text className={styles.description}>
						{isReady
							? 'Your download should start automatically. If it does not, use the button below.'
							: 'New font versions can take up to a minute to prepare. You can keep browsing in the original tab.'}
					</Text>
				</Flex>
				{isReady && (
					<Button component="a" href={download.downloadUrl}>
						Download
					</Button>
				)}
			</Flex>
		</Center>
	);
}
