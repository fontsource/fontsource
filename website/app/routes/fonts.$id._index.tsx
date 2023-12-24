import { generateFontFace } from '@fontsource-utils/generate';
import { Grid } from '@mantine/core';
import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import invariant from 'tiny-invariant';

import { Configure } from '@/components/preview/Configure';
import { TabsWrapper } from '@/components/preview/Tabs';
import { TextArea } from '@/components/preview/TextArea';
import classes from '@/styles/global.module.css';
import { getCSSCache, setCSSCache } from '@/utils/cache.server';
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

	const { family, weights, unicodeRange, styles } = metadata;

	const unicodeKeys = Object.keys(unicodeRange).map((key) =>
		key.replace('[', '').replace(']', ''),
	);

	// Generate static CSS
	let staticCSS = getCSSCache(`s:${id}`) as string;
	if (!staticCSS) {
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

		// Cache in memory
		if (staticCSS) setCSSCache(`s:${id}`, staticCSS);
	}

	// Generate variable CSS
	let variableCSS: string | undefined;
	if (variable) {
		variableCSS = getCSSCache(`v:${id}`);
		if (!variableCSS) {
			for (const style of styles) {
				variableCSS += unicodeKeys
					.map((subset) =>
						generateFontFace({
							family,
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

				// Cache in memory
				if (variableCSS) setCSSCache(`v:${id}`, variableCSS);
			}
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

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	const title = data?.metadata.family
		? `${data.metadata.family} | Fontsource`
		: 'Fontsource';

	const description = data?.metadata.family
		? `Download and self-host the ${data.metadata.family} font in a neatly bundled NPM package.`
		: undefined;
	return ogMeta({ title, description });
};

export default function Font() {
	const data = useLoaderData<FontMetadata>();
	const { metadata, variable, axisRegistry, staticCSS, variableCSS } = data;

	return (
		<TabsWrapper metadata={metadata} tabsValue="preview">
			<Grid className={classes.container}>
				<Grid.Col span={{ base: 12, md: 8 }}>
					<TextArea
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
						metadata={metadata}
						variable={variable}
						axisRegistry={axisRegistry}
					/>
				</Grid.Col>
			</Grid>
		</TabsWrapper>
	);
}
