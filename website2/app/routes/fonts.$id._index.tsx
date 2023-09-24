import { Grid } from '@mantine/core';
import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import invariant from 'tiny-invariant';

import { Configure } from '@/components/preview/Configure';
import { TabsWrapper } from '@/components/preview/Tabs';
import { TextArea } from '@/components/preview/TextArea';
import { getPreviewText } from '@/utils/language/language.server';
import { ogMeta } from '@/utils/meta';
import {
	getAxisRegistry,
	getMetadata,
	getStats,
	getVariable,
} from '@/utils/metadata.server';
import type { AxisRegistryAll, Metadata, VariableData } from '@/utils/types';
import { isStandardAxesKey } from '@/utils/utils.server';

import classes from '../styles/global.module.css';

interface FontMetadata {
	metadata: Metadata;
	variable?: VariableData;
	variableCssKey?: string;
	axisRegistry?: AxisRegistryAll;
	defSubsetText: string;
	downloadCount: number;
}

export const loader = async ({ params }: LoaderFunctionArgs) => {
	const { id } = params;
	invariant(id, 'Missing font ID!');
	const metadata = await getMetadata(id);
	const defSubsetText = getPreviewText(metadata.id, metadata.defSubset);

	const [variable, axisRegistry, stats] = await Promise.all([
		metadata.variable ? getVariable(id) : undefined,
		metadata.variable ? getAxisRegistry() : undefined,
		getStats(id),
	]);

	// If variable, determine the CSS key to use
	let variableCssKey: string | undefined;
	if (variable) {
		const { axes } = variable;
		// Remove ital from keys
		const keys = Object.keys(axes).filter((key) => key !== 'ital');
		if (keys.length === 1 && keys.includes('wght')) {
			variableCssKey = 'wght';
		} else if (keys.length === 1) {
			// Some fonts have a single axis that is not wght
			variableCssKey = keys[0].toLowerCase();
		} else if (keys.every((key) => isStandardAxesKey(key))) {
			variableCssKey = 'standard';
		} else {
			variableCssKey = 'full';
		}
	}

	const res: FontMetadata = {
		metadata,
		variable,
		variableCssKey,
		axisRegistry,
		defSubsetText,
		downloadCount: stats.total.npmDownloadTotal,
	};

	return json(res);
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	const title = data?.metadata.family
		? `${data.metadata.family} | Fontsource`
		: 'Fontsource';

	const description = data?.metadata.family
		? `Self-host ${data.metadata.family} in a neatly bundled package.`
		: 'Self-host Open Source fonts in neatly bundled packages.';
	return ogMeta({ title, description });
};

export default function Font() {
	const data = useLoaderData<FontMetadata>();
	const { metadata, variable, axisRegistry, defSubsetText, variableCssKey } =
		data;

	return (
		<TabsWrapper metadata={metadata} tabsValue="preview">
			<Grid className={classes.container}>
				<Grid.Col span={{ base: 12, md: 8 }}>
					<TextArea
						metadata={metadata}
						previewText={defSubsetText}
						variableCssKey={variableCssKey}
					/>
				</Grid.Col>
				<Grid.Col
					className={classes['hide-less-than-md']}
					span={{ base: 12, md: 4 }}
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
