import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import invariant from 'tiny-invariant';

import { Install } from '@/components/preview/Install';
import { TabsWrapper } from '@/components/preview/Tabs';
import { ogMeta } from '@/utils/meta';
import { getMetadata, getStats, getVariable } from '@/utils/metadata.server';
import type { Metadata, VariableData } from '@/utils/types';

interface FontMetadata {
	metadata: Metadata;
	variable?: VariableData;
	downloadCount: number;
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
		downloadCount: stats.total.npmDownloadTotal,
	};

	return json(res, {
		headers: {
			'Cache-Control': 'public, max-age=300',
		},
	});
};

const generateDescription = (metadata: Metadata) => {
	const { family, category, weights, styles } = metadata;
	const weightDesc =
		weights.length > 1
			? `weights ranging from ${weights[0]} to ${weights.at(-1)}`
			: `a single weight of ${weights[0]}`;

	const italicDesc = styles.includes('italic')
		? ' including italic variants'
		: '';

	return `The ${family} font family is a versatile ${category} web typeface offering ${weightDesc}${italicDesc} for free. Download and self-host via an NPM package for performance and privacy, enhancing your website's typography and user experience.`;
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	const title = data?.metadata.family
		? `${data.metadata.family} | Fontsource`
		: undefined;

	const description = data?.metadata
		? generateDescription(data.metadata)
		: undefined;
	return ogMeta({ title, description });
};

export default function InstallPage() {
	const data = useLoaderData<FontMetadata>();
	const { metadata, variable, downloadCount } = data;

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
