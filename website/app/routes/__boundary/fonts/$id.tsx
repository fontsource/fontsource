import {
	Badge,
	createStyles,
	Grid,
	Group,
	rem,
	Tabs,
	Title,
	useMantineTheme,
} from '@mantine/core';
import { useHover } from '@mantine/hooks';
import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import invariant from 'tiny-invariant';

import { ContentHeader, IconDownload } from '@/components';
import { Configure } from '@/components/preview/Configure';
import { Install } from '@/components/preview/Install';
import { TextArea } from '@/components/preview/TextArea';
import { getPreviewText } from '@/utils/language/language.server';
import { getDownloadCountTotal } from '@/utils/metadata/download.server';
import { getMetadata } from '@/utils/metadata/metadata.server';
import { getAxisRegistry, getVariable } from '@/utils/metadata/variable.server';
import type { AxisRegistry, Metadata, VariableData } from '@/utils/types';

export const loader: LoaderFunction = async ({ params }) => {
	const { id } = params;
	invariant(id, 'Missing font ID!');
	const metadata = await getMetadata(id);
	let variable;
	let axisRegistry;
	if (metadata.variable) {
		variable = await getVariable(id);
		axisRegistry = await getAxisRegistry();
	}
	const downloadCount = await getDownloadCountTotal(id);
	const defSubsetText = getPreviewText(metadata.id, metadata.defSubset);

	return json({
		metadata,
		variable,
		axisRegistry,
		defSubsetText,
		downloadCount,
	});
};

interface FontMetadata {
	metadata: Metadata;
	variable: VariableData;
	axisRegistry: Record<string, AxisRegistry>;
	defSubsetText: string;
	downloadCount: number;
}

const useStyles = createStyles((theme) => ({
	wrapperPreview: {
		maxWidth: '1440px',
		marginLeft: 'auto',
		marginRight: 'auto',
		padding: '40px 64px',

		[theme.fn.smallerThan('lg')]: {
			padding: '40px 40px',
		},

		[theme.fn.smallerThan('xs')]: {
			padding: '40px 24px',
		},
	},

	badge: {
		padding: `${rem(4)} ${rem(8)}`,
		gap: rem(10),
		color:
			theme.colorScheme === 'dark'
				? theme.colors.text[0]
				: theme.colors.text[1],
		backgroundColor:
			theme.colorScheme === 'dark'
				? theme.colors.background[3]
				: theme.colors.background[2],
		borderRadius: rem(4),
		fontFamily: theme.fontFamilyMonospace,
		textTransform: 'lowercase',

		[theme.fn.smallerThan('md')]: {
			display: 'none',
		},
	},

	downloadButton: {
		display: 'flex',
		alignItems: 'center',
		gap: rem(10),
		backgroundColor: 'transparent',
		color:
			theme.colorScheme === 'dark'
				? theme.colors.text[0]
				: theme.colors.text[1],
		border: 'none',
		borderRadius: rem(4),
		padding: `${theme.spacing.xs} ${theme.spacing.md}`,
		cursor: 'pointer',
		textDecoration: 'none',

		'&:hover': {
			backgroundColor: theme.fn.rgba(theme.colors.purple[0], 0.1),
			color: theme.colors.purple[0],
		},

		[theme.fn.smallerThan('sm')]: {
			display: 'none',
		},
	},
}));

export default function Font() {
	const data: FontMetadata = useLoaderData();
	const { metadata, variable, axisRegistry, defSubsetText, downloadCount } =
		data;
	const { classes } = useStyles();
	const theme = useMantineTheme();
	const { hovered, ref } = useHover<HTMLAnchorElement>();

	return (
		<Tabs
			defaultValue="preview"
			unstyled
			styles={(theme) => ({
				tab: {
					...theme.fn.focusStyles(),
					backgroundColor: 'transparent',
					color:
						theme.colorScheme === 'dark'
							? theme.colors.text[0]
							: theme.colors.text[1],
					border: 'none',
					borderRadius: rem(4),
					padding: `${theme.spacing.xs} ${theme.spacing.md}`,
					cursor: 'pointer',
					display: 'flex',
					alignItems: 'center',

					'&[data-active]': {
						backgroundColor: theme.fn.rgba(theme.colors.purple[0], 0.1),
						color: theme.colors.purple[0],
						fontWeight: 700,
					},

					'&:hover': {
						backgroundColor: theme.fn.rgba(theme.colors.purple[0], 0.1),
						color: theme.colors.purple[0],
					},
				},

				tabsList: {
					display: 'flex',
					alignItems: 'center',
					gap: rem(10),
				},
			})}
		>
			<ContentHeader>
				<Group align="center">
					<Title order={1} color="purple.0" pr="lg">
						{metadata.family}
					</Title>
					<Badge color="gray" variant="light" className={classes.badge}>
						{metadata.category}
					</Badge>
					<Badge color="gray" variant="light" className={classes.badge}>
						{metadata.type}
					</Badge>
				</Group>
				<Tabs.List>
					<Tabs.Tab value="preview">Preview</Tabs.Tab>
					<Tabs.Tab value="install">Install</Tabs.Tab>
					<a
						href={`https://api.fontsource.org/v1/fonts/${metadata.id}/download`}
						className={classes.downloadButton}
						ref={ref}
					>
						<IconDownload
							height={19}
							stroke={
								hovered
									? theme.colors.purple[0]
									: theme.colorScheme === 'dark'
									? theme.colors.text[0]
									: theme.colors.text[1]
							}
						/>
						Download
					</a>
				</Tabs.List>
			</ContentHeader>
			<Tabs.Panel value="preview">
				<Grid className={classes.wrapperPreview}>
					<Grid.Col span={12} md={8}>
						<TextArea metadata={metadata} previewText={defSubsetText} />
					</Grid.Col>
					<Grid.Col
						span={12}
						md={4}
						sx={(theme) => ({
							[theme.fn.smallerThan('md')]: {
								display: 'none',
							},
						})}
					>
						<Configure
							metadata={metadata}
							variable={variable}
							axisRegistry={axisRegistry}
						/>
					</Grid.Col>
				</Grid>
			</Tabs.Panel>
			<Tabs.Panel value="install">
				<Install
					metadata={metadata}
					variable={variable}
					downloadCount={downloadCount}
				/>
			</Tabs.Panel>
		</Tabs>
	);
}
