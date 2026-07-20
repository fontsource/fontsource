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

const StyleGrid = ({ pages }: { pages: DiscoveryPage[] }) => (
	<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
		{pages.map((page) => (
			<Card
				key={page.path}
				component={Link}
				to={page.path}
				prefetch="intent"
				padding="lg"
				radius="md"
				className={`${classes.link} ${classes.card}`}
			>
				<Group justify="space-between" align="center" wrap="nowrap">
					<div>
						<Title order={3}>{page.heading}</Title>
						<Text mt="xs" c="dimmed" size="sm">
							{page.count.toLocaleString('en-US')} families
						</Text>
					</div>
					<IconArrowRight aria-hidden size={20} />
				</Group>
			</Card>
		))}
	</SimpleGrid>
);

const LanguageDirectory = ({ pages }: { pages: DiscoveryPage[] }) => (
	<nav aria-label="Fonts by language">
		<SimpleGrid
			component="ul"
			cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
			spacing="sm"
			className={classes.languageGrid}
		>
			{pages.map((page) => (
				<li key={page.path}>
					<Link
						to={page.path}
						prefetch="intent"
						className={`${classes.link} ${classes.languageLink}`}
					>
						<div>
							<Text component="span" fw={600}>
								{page.heading}
							</Text>
							<Text component="span" display="block" c="dimmed" size="xs">
								{page.count.toLocaleString('en-US')} families
							</Text>
						</div>
						<IconArrowRight aria-hidden size={18} />
					</Link>
				</li>
			))}
		</SimpleGrid>
	</nav>
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
						Choose a style, language, or variable-font format. Every page
						includes the full catalog filters and preview controls.
					</Text>
				</Stack>
			</ContentHeader>
			<Container size="xl" py="xl">
				<Stack gap={48}>
					<section>
						<Title order={2}>Font styles and features</Title>
						<Text c="dimmed" mt="xs" mb="md">
							Start with a broad visual style or explore flexible variable
							fonts.
						</Text>
						<StyleGrid pages={stylesAndFeatures} />
					</section>
					<section>
						<Title order={2}>Fonts by language</Title>
						<Text c="dimmed" mt="xs" mb="md" maw={720}>
							Find families for the language your project supports. Each page
							starts with the matching Fontsource character subset selected.
						</Text>
						<LanguageDirectory pages={languages} />
					</section>
				</Stack>
			</Container>
		</>
	);
}
