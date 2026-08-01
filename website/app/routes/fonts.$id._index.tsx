import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data, useLoaderData } from 'react-router';
import invariant from 'tiny-invariant';

import { FamilyPreview } from '@/components/font-page/FamilyPreview';
import { TabsWrapper } from '@/components/preview/Tabs';
import {
	type GetFontResponse,
	getFont,
	getFontVersions,
	getRegistryFamily,
	getVariableFont,
} from '@/generated/api';
import { cacheHeaders } from '@/utils/cache';
import { getFontPreviewCSS } from '@/utils/font-preview';
import { getFontOpenGraphImage, ogMeta } from '@/utils/meta';
import { validateRegistryFamily } from '@/utils/registry';

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
	const { id } = params;
	invariant(id, 'Missing font ID!');
	const parameters = { id };
	const options = { signal: request.signal };
	const metadataPromise = getFont(parameters, options);
	const [metadata, variable, versions, registryResult] = await Promise.all([
		metadataPromise,
		metadataPromise.then((metadata) =>
			metadata.variable
				? getVariableFont(parameters, options).catch(() => undefined)
				: undefined,
		),
		getFontVersions(parameters, options),
		getRegistryFamily(parameters, options).then(
			(value) => {
				const registry = validateRegistryFamily(value);
				return { value: registry, unavailable: !registry };
			},
			() => ({ value: undefined, unavailable: true }),
		),
	]);
	const { staticCSS, variableCSS } = getFontPreviewCSS(metadata, variable);

	return data(
		{
			metadata,
			staticCSS,
			variable,
			variableCSS,
			versions,
			registry: registryResult.value,
			registryUnavailable: registryResult.unavailable,
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
	const image = loaderData?.metadata
		? getFontOpenGraphImage(loaderData.metadata)
		: undefined;
	return ogMeta({ title, description, image });
};

export default function Font() {
	const {
		metadata,
		staticCSS,
		variable,
		variableCSS,
		versions,
		registry,
		registryUnavailable,
	} = useLoaderData<typeof loader>();

	return (
		<TabsWrapper
			metadata={metadata}
			registry={registry}
			variableAvailable={Boolean(variable)}
			tabsValue="preview"
		>
			<FamilyPreview
				key={metadata.id}
				metadata={metadata}
				staticCSS={staticCSS}
				variable={variable}
				variableCSS={variableCSS}
				versions={versions}
				registry={registry}
				registryUnavailable={registryUnavailable}
				variableUnavailable={metadata.variable && !variable}
			/>
		</TabsWrapper>
	);
}
