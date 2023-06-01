import { createStyles, Grid } from '@mantine/core';
import type { LoaderArgs, V2_MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import invariant from 'tiny-invariant';

import { Configure } from '@/components/preview/Configure';
import { TabsWrapper } from '@/components/preview/Tabs';
import { TextArea } from '@/components/preview/TextArea';
import { getPreviewText } from '@/utils/language/language.server';
import { ogMeta } from '@/utils/meta';
import { getDownloadCountTotal } from '@/utils/metadata/download.server';
import { getMetadata } from '@/utils/metadata/metadata.server';
import { getAxisRegistry, getVariable } from '@/utils/metadata/variable.server';
import type { AxisRegistryAll, Metadata, VariableData } from '@/utils/types';

interface FontMetadata {
	metadata: Metadata;
	variable: VariableData;
	axisRegistry?: AxisRegistryAll;
	defSubsetText: string;
	downloadCount: number;
}

export const loader = async ({ params }: LoaderArgs) => {
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

	const res: FontMetadata = {
		metadata,
		variable,
		axisRegistry,
		defSubsetText,
		downloadCount,
	};

	return json(res);
};

export const meta: V2_MetaFunction<typeof loader> = ({ data }) => {
	const title = data?.metadata.family
		? `${data.metadata.family} | Fontsource`
		: 'Fontsource';

	const description = data?.metadata.family
		? `Self-host ${data.metadata.family} in a neatly bundled package.`
		: 'Self-host Open Source fonts in neatly bundled packages.';
	return ogMeta({ title, description });
};

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
