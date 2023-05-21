import { createStyles, Grid } from '@mantine/core';
import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import invariant from 'tiny-invariant';

import { Configure } from '@/components/preview/Configure';
import { TabsWrapper } from '@/components/preview/Tabs';
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
}));

export default function Font() {
	const data: FontMetadata = useLoaderData();
	const { metadata, variable, axisRegistry, defSubsetText } = data;
	const { classes } = useStyles();

	return (
		<TabsWrapper metadata={metadata} tabsValue="preview">
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
		</TabsWrapper>
	);
}
