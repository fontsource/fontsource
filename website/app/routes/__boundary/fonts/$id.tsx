import { Badge, createStyles, Group, rem, Tabs, Title } from '@mantine/core';
import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import invariant from 'tiny-invariant';

import { ContentHeader } from '@/components';
import { Configure } from '@/components/preview/Configure';
import { TextArea } from '@/components/preview/TextArea';
import { getPreviewText } from '@/utils/language/language.server';
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

	const defSubsetText = getPreviewText(metadata.id, metadata.defSubset);

	return json({ metadata, variable, axisRegistry, defSubsetText });
};

interface FontMetadata {
	metadata: Metadata;
	variable: VariableData;
	axisRegistry: Record<string, AxisRegistry>;
	defSubsetText: string;
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
		backgroundColor: theme.colors.background[2],
		borderRadius: rem(4),
		fontFamily: theme.fontFamilyMonospace,
		textTransform: 'lowercase'
	}
}));

export default function Font() {
	const data: FontMetadata = useLoaderData();
	const { metadata, variable, axisRegistry, defSubsetText } = data;
	const { classes } = useStyles();

	return (
		<Tabs defaultValue="preview" variant="pills">
			<ContentHeader>
				<Group align='center'>
					<Title order={1} color="purple" pr='lg'>
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
			<Tabs.Panel value="install">Install</Tabs.Panel>
			<Tabs.Panel value="download">Download</Tabs.Panel>
		</Tabs>
	);
}
