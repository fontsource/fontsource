import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data, useLoaderData } from 'react-router';
import invariant from 'tiny-invariant';

import { FamilyUse } from '@/components/font-page/FamilyUse';
import { TabsWrapper } from '@/components/preview/Tabs';
import {
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
	const previewCSS = getFontPreviewCSS(metadata, variable);

	return data(
		{
			metadata,
			variable,
			versions,
			registry: registryResult.value,
			registryUnavailable: registryResult.unavailable,
			...previewCSS,
		},
		{ headers: cacheHeaders.short },
	);
};

export const meta: MetaFunction<typeof loader> = ({ loaderData }) => {
	const family = loaderData?.metadata.family;
	return ogMeta({
		title: family ? `Get ${family} | Fontsource` : undefined,
		description: family
			? `Download ${family} or add it to a website with a package or CDN.`
			: undefined,
		image: loaderData?.metadata
			? getFontOpenGraphImage(loaderData.metadata)
			: undefined,
	});
};

export default function UsePage() {
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
			tabsValue="use"
		>
			<FamilyUse
				key={metadata.id}
				metadata={metadata}
				staticCSS={staticCSS}
				variable={variable}
				variableCSS={variableCSS}
				versions={versions}
				registry={registry}
				registryUnavailable={registryUnavailable}
			/>
		</TabsWrapper>
	);
}
