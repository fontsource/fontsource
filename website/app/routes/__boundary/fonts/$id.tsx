import {
	Badge,
	createStyles,
	Grid,
	Group,
	rem,
	Tabs,
	Title,
} from '@mantine/core';
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
	},
}));

export default function Font() {
	const data: FontMetadata = useLoaderData();
	const { metadata, variable, axisRegistry, defSubsetText, downloadCount } =
		data;
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
			<Tabs.Panel value="preview">
				<Grid className={classes.wrapperPreview}>
					<Grid.Col span={8}>
						<TextArea metadata={metadata} previewText={defSubsetText} />
					</Grid.Col>
					<Grid.Col span={4}>
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
			<Tabs.Panel value="download">Download</Tabs.Panel>
		</Tabs>
	);
}
