import {
	Card,
	Container,
	Group,
	SimpleGrid,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data, Link, useLoaderData } from 'react-router';

import { ContentHeader } from '@/components/layout/ContentHeader';
import classes from '@/styles/browse.module.css';
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
				prefetch="intent"
				padding="lg"
				radius="md"
				className={classes.card}
			>
				<Group justify="space-between" align="center" wrap="nowrap">
					<div>
						<Title order={3}>{page.heading}</Title>
						<Text mt="xs" c="dimmed" size="sm">
							{page.count} families
						</Text>
					</div>
					<IconArrowRight aria-hidden size={20} />
				</Group>
			</Card>
		))}
	</SimpleGrid>
);

const PageSection = ({
	title,
	description,
	pages,
}: {
	title: string;
	description: string;
	pages: DiscoveryPage[];
}) => (
	<section>
		<Title order={2}>{title}</Title>
		<Text c="dimmed" mt="xs" mb="md">
			{description}
		</Text>
		<PageGrid pages={pages} />
	</section>
);

export default function Browse() {
	const { pages } = useLoaderData<typeof loader>();
	const languages = pages.filter((page) => page.kind === 'language');
	const stylesAndFeatures = pages.filter((page) => page.kind !== 'language');

	return (
		<>
			<ContentHeader>
				<Stack gap="xs" maw={800}>
					<Title order={1} c="purple.0">
						Browse Fonts
					</Title>
					<Text>
						Choose a starting point, then refine the results with the same
						filters and previews available in the full font catalog.
					</Text>
				</Stack>
			</ContentHeader>
			<Container size="xl" py="xl">
				<Stack gap="xl">
					<PageSection
						title="Browse by style and features"
						description="Start with a broad font category or explore families with variable axes."
						pages={stylesAndFeatures}
					/>
					<PageSection
						title="Language support"
						description="Find font families that publish the character subset your project needs."
						pages={languages}
					/>
				</Stack>
			</Container>
		</>
	);
}
