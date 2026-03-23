import {
	type FontStyle,
	generateCSS,
	type UrlResolver,
} from '@fontsource-utils/core';
import { useObservable } from '@legendapp/state/react';
import { Grid } from '@mantine/core';
import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data, useLoaderData } from 'react-router';
import invariant from 'tiny-invariant';

import { Configure } from '@/components/preview/Configure';
import {
	createFontVariation,
	type FontIDObject,
} from '@/components/preview/observables';
import { TabsWrapper } from '@/components/preview/Tabs';
import { TextArea } from '@/components/preview/TextArea';
import classes from '@/styles/global.module.css';
import { getPreviewText } from '@/utils/language/language';
import { ogMeta } from '@/utils/meta';
import {
	getAxisRegistry,
	getMetadata,
	getStats,
	getVariable,
} from '@/utils/metadata.server';
import type { AxisRegistryAll, Metadata, VariableData } from '@/utils/types';

interface FontMetadata {
	metadata: Metadata;
	variable?: VariableData;
	staticCSS: string;
	variableCSS?: string;
	axisRegistry?: AxisRegistryAll;
	downloadCount: number;
}

export const loader = async ({ params }: LoaderFunctionArgs) => {
	const { id } = params;
	invariant(id, 'Missing font ID!');
	const metadata = await getMetadata(id);

	const [variable, axisRegistry, stats] = await Promise.all([
		metadata.variable ? getVariable(id) : undefined,
		metadata.variable ? getAxisRegistry() : undefined,
		getStats(id),
	]);

	const { family, weights, unicodeRange, styles, subsets } = metadata;

	let unicodeKeys = Object.keys(unicodeRange).map((key) =>
		key.replace('[', '').replace(']', ''),
	);

	// Some custom families do not store unicode keys.
	if (unicodeKeys.length === 0) {
		unicodeKeys = subsets;
	}

	const jsDelivrResolver =
		(isVariable = false): UrlResolver =>
		({ source }) => {
			const prefix = `${id}-`;
			// This route serves CDN filenames without the package id prefix.
			const cdnFilename = source.filename.startsWith(prefix)
				? source.filename.slice(prefix.length)
				: source.filename;

			return `https://cdn.jsdelivr.net/fontsource/fonts/${id}${isVariable ? ':vf' : ''}@latest/${cdnFilename}`;
		};

	const cssConfig = {
		id,
		family,
		subsets: unicodeKeys,
		weights,
		styles: styles as FontStyle[],
		unicodeRange,
	};

	const staticCSS = generateCSS(cssConfig, {
		resolver: jsDelivrResolver(),
		display: 'block',
	});

	const variableCSS = variable
		? generateCSS(
				{
					...cssConfig,
					variable: variable.axes,
				},
				{
					resolver: jsDelivrResolver(true),
					display: 'block',
				},
			)
		: undefined;

	const res: FontMetadata = {
		metadata,
		variable,
		staticCSS,
		variableCSS,
		axisRegistry,
		downloadCount: stats.total.npmDownloadTotal,
	};

	return data(res, {
		headers: {
			'Cache-Control': 'public, max-age=300',
		},
	});
};

const generateDescription = (metadata: Metadata) => {
	const { family, category, variable } = metadata;

	const variableDesc = variable ? 'variable ' : '';

	return `Download the ${family} ${variableDesc}${category}font family web typeface. Self-host typography for your website.`;
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	const title = data?.metadata.family
		? `${data.metadata.family} | Fontsource`
		: 'Fontsource';

	const description = data?.metadata
		? generateDescription(data.metadata)
		: undefined;
	return ogMeta({ title, description });
};

export default function Font() {
	const data = useLoaderData<FontMetadata>();
	const { metadata, variable, axisRegistry, staticCSS, variableCSS } = data;

	const state$ = useObservable<FontIDObject>({
		preview: {
			language: 'latin',
			size: 32,
			italic: false,
			lineHeight: 2,
			letterSpacing: 0,
			transparency: 100,
			color: '#000000',

			text: 'Sphinx of black quartz, judge my vow.',
		},
		variable: {},
		fontVariation: '',
	});

	// If language changes, update text using getPreviewText
	state$.preview.language.onChange((e) => {
		state$.preview.text.set(getPreviewText(e.value));
	});

	// Verify that the color is a valid hex code
	const COLOR_REGEX = /^#[\dA-Fa-f]{0,6}$/;
	state$.preview.color.onChange((e) => {
		if (!COLOR_REGEX.test(e.value)) state$.preview.color.set(e.getPrevious());
	});

	// Update fontVariation when variableState changes
	state$.variable.onChange(() => {
		state$.fontVariation.set(createFontVariation(state$.variable.get()));
	});

	return (
		<TabsWrapper metadata={metadata} tabsValue="preview">
			<Grid className={classes.container}>
				<Grid.Col span={{ base: 12, md: 8 }}>
					<TextArea
						state$={state$}
						metadata={metadata}
						staticCSS={staticCSS}
						variableCSS={variableCSS}
					/>
				</Grid.Col>
				<Grid.Col
					className={classes['hide-less-than-md']}
					span={{ base: 12, md: 4 }}
				>
					<Configure
						state$={state$}
						metadata={metadata}
						variable={variable}
						axisRegistry={axisRegistry}
					/>
				</Grid.Col>
			</Grid>
		</TabsWrapper>
	);
}
