import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data, useLoaderData } from 'react-router';
import invariant from 'tiny-invariant';

import { Install } from '@/components/preview/Install';
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
			downloadCount: stats.total.npmDownloadTotal,
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

	return `The ${family} ${variableDesc}font family is a versatile ${category} web typeface offering ${weightDesc}${italicDesc} for free. Download and self-host via an NPM package for performance and privacy, enhancing your website's typography and user experience.`;
};

export const meta: MetaFunction<typeof loader> = ({ loaderData }) => {
	const title = loaderData?.metadata.family
		? `${loaderData.metadata.family} | Install | Fontsource`
		: undefined;

	const description = loaderData?.metadata
		? generateDescription(loaderData.metadata)
		: undefined;
	return ogMeta({ title, description });
};

export default function InstallPage() {
	const { metadata, variable, downloadCount } = useLoaderData<typeof loader>();

	return (
		<TabsWrapper metadata={metadata} tabsValue="install">
			<Install
				metadata={metadata}
				variable={variable}
				downloadCount={downloadCount}
			/>
		</TabsWrapper>
	);
}
