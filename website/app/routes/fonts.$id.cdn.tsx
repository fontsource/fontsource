import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data, useLoaderData } from 'react-router';
import invariant from 'tiny-invariant';

import { CDN } from '@/components/preview/CDN';
import { TabsWrapper } from '@/components/preview/Tabs';
import {
	getFont,
	getFontStats,
	getVariableFont,
	type GetFontResponse,
} from '@/generated/api';
import { cacheHeaders } from '@/utils/cache';
import { ogMeta } from '@/utils/meta';

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
	const { id } = params;
	invariant(id, 'Missing font ID!');
	const parameters = { id };
	const options = { signal: request.signal };

	const [metadata, variable, stats] = await Promise.all([
		getFont(parameters, options),
		getVariableFont(parameters, options).catch(() => undefined), // Always try to load, fail gracefully
		getFontStats(parameters, options),
	]);

	return data(
		{
			metadata,
			variable,
			hits: stats.total.jsDelivrHitsTotal,
		},
		{ headers: cacheHeaders.short },
	);
};

const generateDescription = (metadata: GetFontResponse) => {
	const { family, category, weights, styles, variable } = metadata;
	const weightDesc =
		weights.length > 1
			? `weights ranging from ${weights[0]} to ${weights.at(-1)}`
			: `a single weight of ${weights[0]}`;

	const italicDesc = styles.includes('italic')
		? ' including italic variants'
		: '';

	const variableDesc = variable ? 'variable ' : '';

	return `The ${family} ${variableDesc}font family is a versatile ${category} web typeface offering ${weightDesc}${italicDesc} for free. Hosted on a privacy-friendly CDN that is free to use and simple to integrate into your website.`;
};

export const meta: MetaFunction<typeof loader> = ({ loaderData }) => {
	const title = loaderData?.metadata.family
		? `${loaderData.metadata.family} | CDN | Fontsource`
		: undefined;

	const description = loaderData?.metadata
		? generateDescription(loaderData.metadata)
		: undefined;
	return ogMeta({ title, description });
};

export default function CDNPage() {
	const { metadata, variable, hits } = useLoaderData<typeof loader>();

	return (
		<TabsWrapper metadata={metadata} tabsValue="cdn">
			<CDN metadata={metadata} variable={variable} hits={hits} />
		</TabsWrapper>
	);
}
