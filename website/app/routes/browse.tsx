import { Card, Container, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data, Link, useLoaderData } from 'react-router';

import { ContentHeader } from '@/components/layout/ContentHeader';
import { cacheHeaders } from '@/utils/cache';
import type { DiscoveryPage } from '@/utils/discovery';
import { loadDiscoveryPages } from '@/utils/discovery.server';
import { ogMeta } from '@/utils/meta';

export const loader = async ({ request }: LoaderFunctionArgs) =>
	data(
		{ pages: await loadDiscoveryPages(request.signal) },
		{ headers: cacheHeaders.short },
	);

export const meta: MetaFunction = () =>
	ogMeta({
		title: 'Browse Open-Source Fonts | Fontsource',
		description:
			'Browse open-source fonts by language, category, and variable-font support, then preview and self-host your selection with Fontsource.',
	});

const PageGrid = ({ pages }: { pages: DiscoveryPage[] }) => (
	<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
		{pages.map((page) => (
			<Card
				key={page.path}
				component={Link}
				to={page.path}
				padding="lg"
				withBorder
				style={{ color: 'inherit', textDecoration: 'none' }}
			>
				<Title order={3}>{page.heading}</Title>
				<Text mt="xs" c="dimmed">
					{page.count} families
				</Text>
			</Card>
		))}
	</SimpleGrid>
);

export default function Browse() {
	const { pages } = useLoaderData<typeof loader>();
	const languages = pages.filter((page) => page.kind === 'language');
	const categories = pages.filter((page) => page.kind === 'category');
	const features = pages.filter((page) => page.kind === 'variable');

	return (
		<>
			<ContentHeader>
				<Stack gap="xs" maw={800}>
					<Title order={1} c="purple.0">
						Browse Fonts
					</Title>
					<Text>
						Start with a useful catalog view, then refine it with the same
						flexible filters and previews available on the main font search.
					</Text>
				</Stack>
			</ContentHeader>
			<Container size="xl" py="xl">
				<Stack gap="xl">
					<section>
						<Title order={2} mb="md">
							Languages
						</Title>
						<PageGrid pages={languages} />
					</section>
					<section>
						<Title order={2} mb="md">
							Categories
						</Title>
						<PageGrid pages={categories} />
					</section>
					<section>
						<Title order={2} mb="md">
							Features
						</Title>
						<PageGrid pages={features} />
					</section>
				</Stack>
			</Container>
		</>
	);
}
