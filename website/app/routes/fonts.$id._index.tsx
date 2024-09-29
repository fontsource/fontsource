import { generateFontFace } from '@fontsource-utils/generate';
import { useObservable } from '@legendapp/state/react';
import { Grid } from '@mantine/core';
import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
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
import { isStandardAxesKey } from '@/utils/utils.server';

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

	const { family, weights, unicodeRange, styles, subsets } = metadata;

	let unicodeKeys = Object.keys(unicodeRange).map((key) =>
		key.replace('[', '').replace(']', ''),
	);

	// Non-google fonts have no unicode keys stored, thus we need to use the subsets
	if (unicodeKeys.length === 0) {
		unicodeKeys = subsets;
	}

	// Generate static CSS
	let staticCSS = '';
	for (const weight of weights) {
		for (const style of styles) {
			staticCSS += unicodeKeys
				.map((subset) =>
					generateFontFace({
						family,
						display: 'block',
						style,
						weight,
						src: [
							{
								url: `https://cdn.jsdelivr.net/fontsource/fonts/${id}@latest/${subset}-${weight}-${style}.woff2`,
								format: 'woff2',
							},
						],
						unicodeRange: unicodeRange[subset],
					}),
				)
				.join('\n');
		}
	}

	// Generate variable CSS
	let variableCSS: string | undefined;
	if (variable) {
		variableCSS = '';

		for (const style of styles) {
			variableCSS += unicodeKeys
				.map((subset) =>
					generateFontFace({
						family: `${family} Variable`,
						display: 'block',
						style,
						weight: 400,
						src: [
							{
								url: `https://cdn.jsdelivr.net/fontsource/fonts/${id}:vf@latest/${subset}-${variableCssKey}-${style}.woff2`,
								format: 'woff2-variations',
							},
						],
						unicodeRange: unicodeRange[subset],
						variable: {
							wght: variable.axes.wght,
							stretch: variable.axes.wdth,
							slnt: variable.axes.slnt,
						},
					}),
				)
				.join('\n');
		}
	}

	const res: FontMetadata = {
		metadata,
		variable,
		staticCSS,
		variableCSS,
		axisRegistry,
		downloadCount: stats.total.npmDownloadTotal,
	};

	return json(res, {
		headers: {
			'Cache-Control': 'public, max-age=300',
		},
	});
};

const generateDescription = (metadata: Metadata) => {
	const { family, category, weights, styles, variable } = metadata;
	const weightDesc =
		weights.length > 1
			? `weights ranging from ${weights[0]} to ${weights.at(-1)}`
			: `a single weight of ${weights[0]}`;

	const italicDesc = styles.includes('italic')
		? ' including italic variants'
		: '';

	const variableDesc = variable ? 'variable ' : '';

	return `The ${family} ${variableDesc}font family is a versatile ${category} web typeface offering ${weightDesc}${italicDesc} for free. Download and self-host via an NPM package for performance and privacy, enhancing your website's typography and user experience.`;
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
