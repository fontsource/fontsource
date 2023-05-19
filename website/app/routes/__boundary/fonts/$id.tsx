import { Badge, createStyles, Group, rem, Tabs, Title } from '@mantine/core';
import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import invariant from 'tiny-invariant';

import { ContentHeader } from '@/components';
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

	return json({ metadata, variable, axisRegistry, defSubsetText, downloadCount});
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
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-between',
		padding: '24px',
	},

	badge: {
		padding: `${rem(4)} ${rem(8)}`,
		gap: rem(10),
		color: theme.colorScheme === 'dark' ? theme.colors.text[0] : theme.colors.text[1],
		backgroundColor: theme.colorScheme === 'dark' ? theme.colors.background[3] : theme.colors.background[2],
		borderRadius: rem(4),
		fontFamily: theme.fontFamilyMonospace,
		textTransform: 'lowercase',
	},

	infoWrapper: {
		width: rem(332),
		padding: rem(24),
		border:
			theme.colorScheme === 'dark'
				? `${rem(1)} solid ${theme.colors.border[1]}`
				: `${rem(1)} solid ${theme.colors.border[0]}`,
		borderRadius: rem(4),
	},

	infoButton: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		padding: `${rem(8)} ${rem(16)}`,
		border:
			theme.colorScheme === 'dark'
				? `${rem(1)} solid ${theme.colors.border[1]}`
				: `${rem(1)} solid ${theme.colors.border[0]}`,
		borderRadius: rem(4),

		'&:hover': {
			backgroundColor:
				theme.colorScheme === 'dark'
					? theme.fn.darken(theme.colors.background[4], 0.5)
					: theme.fn.lighten(theme.colors.purple[0], 0.98),
		},
	},
}));

export default function Font() {
	const data: FontMetadata = useLoaderData();
	const { metadata, variable, axisRegistry, defSubsetText, downloadCount } = data;
	const { classes } = useStyles();

	return (
		<Tabs defaultValue="preview" variant="pills">
			<ContentHeader>
				<Group align="center">
					<Title order={1} color="purple" pr="lg">
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
					<Tabs.Tab value="download">Download</Tabs.Tab>
				</Tabs.List>
			</ContentHeader>
			<Tabs.Panel value="preview" className={classes.wrapperPreview}>
				<TextArea metadata={metadata} previewText={defSubsetText} />
				<Configure
					metadata={metadata}
					variable={variable}
					axisRegistry={axisRegistry}
				/>
			</Tabs.Panel>
			<Tabs.Panel value="install">
				<Install metadata={metadata} variable={variable} downloadCount={downloadCount} />
			</Tabs.Panel>
			<Tabs.Panel value="download">Download</Tabs.Panel>
		</Tabs>
	);
}
