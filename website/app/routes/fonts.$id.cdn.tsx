import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import invariant from 'tiny-invariant';

import { CDN } from '@/components/preview/CDN';
import { TabsWrapper } from '@/components/preview/Tabs';
import { ogMeta } from '@/utils/meta';
import { getMetadata, getStats, getVariable } from '@/utils/metadata.server';
import type { Metadata, VariableData } from '@/utils/types';

interface FontMetadata {
	metadata: Metadata;
	variable?: VariableData;
	hits: number;
}

export const loader = async ({ params }: LoaderFunctionArgs) => {
	const { id } = params;
	invariant(id, 'Missing font ID!');

	const metadata = await getMetadata(id);
	const [variable, stats] = await Promise.all([
		metadata.variable ? getVariable(id) : undefined,
		getStats(id),
	]);

	const res: FontMetadata = {
		metadata,
		variable,
		hits: stats.total.jsDelivrHitsTotal,
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

	return `The ${family} ${variableDesc}font family is a versatile ${category} web typeface offering ${weightDesc}${italicDesc} for free. Hosted on a privacy-friendly CDN that is free to use and simple to integrate into your website.`;
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	const title = data?.metadata.family
		? `${data.metadata.family} | CDN | Fontsource`
		: undefined;

	const description = data?.metadata
		? generateDescription(data.metadata)
		: undefined;
	return ogMeta({ title, description });
};

export default function CDNPage() {
	const data = useLoaderData<FontMetadata>();
	const { metadata, variable, hits } = data;

	return (
		<TabsWrapper metadata={metadata} tabsValue="cdn">
			<CDN metadata={metadata} variable={variable} hits={hits} />
		</TabsWrapper>
	);
}
