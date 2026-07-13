import { generateCSS, selectVariableAxisKey } from '@fontsource-utils/core';
import { batch } from '@legendapp/state';
import { useObservable } from '@legendapp/state/react';
import { Grid } from '@mantine/core';
import { useEffect } from 'react';
import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data, useLoaderData } from 'react-router';
import invariant from 'tiny-invariant';

import { Configure } from '@/components/preview/Configure';
import {
	createFontVariation,
	type FontIDObject,
	type FontIDState,
} from '@/components/preview/observables';
import { TabsWrapper } from '@/components/preview/Tabs';
import { TextArea } from '@/components/preview/TextArea';
import {
	getFont,
	getFontStats,
	getVariableFont,
	listAxisRegistry,
	type GetFontResponse,
} from '@/generated/api';
import classes from '@/styles/global.module.css';
import { cacheHeaders } from '@/utils/cache';
import { jsDelivrResolver } from '@/utils/cdn';
import { getPreviewText } from '@/utils/language/language';
import { ogMeta } from '@/utils/meta';

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
	const { id } = params;
	invariant(id, 'Missing font ID!');
	const parameters = { id };
	const options = { signal: request.signal };
	const metadata = await getFont(parameters, options);

	const [variable, axisRegistry, stats] = await Promise.all([
		metadata.variable ? getVariableFont(parameters, options) : undefined,
		metadata.variable ? listAxisRegistry({}, options) : undefined,
		getFontStats(parameters, options),
	]);

	const { family, weights, unicodeRange, styles, subsets } = metadata;

	let unicodeKeys = Object.keys(unicodeRange).map((key) =>
		key.replace('[', '').replace(']', ''),
	);

	// Some custom families do not store unicode keys.
	if (unicodeKeys.length === 0) {
		unicodeKeys = subsets;
	}

	const cssConfig = {
		id,
		family,
		subsets: unicodeKeys,
		weights,
		styles,
		unicodeRange,
	};

	const staticCSS = generateCSS(cssConfig, {
		resolver: jsDelivrResolver(id),
		display: 'block',
	});

	const variableCSS = variable
		? generateCSS(
				{
					...cssConfig,
					variable: variable.axes,
				},
				{
					axisKeys: [
						selectVariableAxisKey(variable.axes, Object.keys(variable.axes)),
					],
					resolver: jsDelivrResolver(id, true),
					display: 'block',
				},
			)
		: undefined;

	return data(
		{
			metadata,
			variable,
			staticCSS,
			variableCSS,
			axisRegistry,
			downloadCount: stats.total.npmDownloadTotal,
		},
		{ headers: cacheHeaders.short },
	);
};

const generateDescription = (metadata: GetFontResponse) => {
	const { family, category, variable } = metadata;

	const variableDesc = variable ? 'variable ' : '';

	return `Download the ${family} ${variableDesc}${category} font family web typeface. Self-host typography for your website.`;
};

export const meta: MetaFunction<typeof loader> = ({ loaderData }) => {
	const title = loaderData?.metadata.family
		? `${loaderData.metadata.family} | Fontsource`
		: 'Fontsource';

	const description = loaderData?.metadata
		? generateDescription(loaderData.metadata)
		: undefined;
	return ogMeta({ title, description });
};

export default function Font() {
	const { metadata, variable, axisRegistry, staticCSS, variableCSS } =
		useLoaderData<typeof loader>();

	const state$: FontIDState = useObservable<FontIDObject>({
		preview: {
			language: metadata.defSubset,
			size: 32,
			italic: false,
			lineHeight: 2,
			letterSpacing: 0,
			transparency: 100,
			color: '#000000',
			text: getPreviewText(metadata.defSubset, metadata.id),
		},
		variable: {},
		fontVariation: (): string => createFontVariation(state$.variable.get()),
	});

	useEffect(() => {
		batch(() => {
			state$.preview.assign({
				language: metadata.defSubset,
				text: getPreviewText(metadata.defSubset, metadata.id),
				italic: false,
			});
			state$.variable.set({});
		});
	}, [metadata.defSubset, metadata.id, state$]);

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
