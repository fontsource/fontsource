import { Center, Flex, Loader, Text, Title } from '@mantine/core';
import { useEffect, useRef } from 'react';
import type { ActionFunctionArgs, MetaFunction } from 'react-router';
import { data, redirectDocument, useFetcher } from 'react-router';
import invariant from 'tiny-invariant';

import styles from '@/components/ErrorBoundary.module.css';
import { cacheHeaders } from '@/utils/cache';

export const meta: MetaFunction = () => [
	{ name: 'robots', content: 'noindex, nofollow' },
];

export const action = async ({ params }: ActionFunctionArgs) => {
	const { id } = params;
	invariant(id, 'Missing font ID!');

	const downloadUrl = `https://fontsource-api.fontsource.workers.dev/v1/download/${encodeURIComponent(id)}`;
	const response = await fetch(downloadUrl, { method: 'HEAD' });

	if (!response.ok) {
		throw data(null, {
			status: response.status,
			statusText: response.statusText,
			headers: cacheHeaders.noStore,
		});
	}

	return redirectDocument(downloadUrl);
};

export default function Download() {
	const { submit } = useFetcher();
	const started = useRef(false);

	useEffect(() => {
		if (started.current) return;
		started.current = true;
		void submit(null, { method: 'post' });
	}, [submit]);

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
