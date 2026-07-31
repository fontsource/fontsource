import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data, useLoaderData } from 'react-router';
import invariant from 'tiny-invariant';

import { CharacterExplorer } from '@/components/font-page/CharacterExplorer';
import { TabsWrapper } from '@/components/preview/Tabs';
import {
	getFont,
	getRegistryFamily,
	getRegistryFamilySymbols,
	getRegistrySourceCapabilities,
	getVariableFont,
	listRegistryLanguages,
} from '@/generated/api';
import { cacheHeaders } from '@/utils/cache';
import { getFontPreviewCSS } from '@/utils/font-preview';
import { getFontOpenGraphImage, ogMeta } from '@/utils/meta';
import {
	selectRegistryFamilyLanguages,
	selectRegistrySource,
} from '@/utils/registry';

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
	const { id } = params;
	invariant(id, 'Missing font ID!');
	const parameters = { id };
	const options = { signal: request.signal };
	const metadataPromise = getFont(parameters, options);
	const registryResultPromise = getRegistryFamily(parameters, options).then(
		(value) => ({ value, unavailable: false }),
		() => ({ value: undefined, unavailable: true }),
	);
	const variablePromise = metadataPromise.then((metadata) =>
		metadata.variable
			? getVariableFont(parameters, options).catch(() => undefined)
			: undefined,
	);
	const languagesResultPromise = listRegistryLanguages(options).then(
		(value) => ({ value, unavailable: false }),
		() => ({ value: undefined, unavailable: true }),
	);
	const registryDetailsPromise = registryResultPromise.then(
		async (registryResult) => {
			const capabilitySource = selectRegistrySource(registryResult.value);
			const [symbolsResult, capabilitiesResult] = await Promise.all([
				registryResult.value?.symbolsUrl
					? getRegistryFamilySymbols(parameters, options).then(
							(value) => ({ value, unavailable: false }),
							() => ({ value: undefined, unavailable: true }),
						)
					: { value: undefined, unavailable: false },
				capabilitySource
					? getRegistrySourceCapabilities(
							{ sha256: capabilitySource.sha256 },
							options,
						).then(
							(value) => ({ value, unavailable: false }),
							() => ({ value: undefined, unavailable: true }),
						)
					: { value: undefined, unavailable: false },
			]);

			return { capabilitySource, symbolsResult, capabilitiesResult };
		},
	);
	const [metadata, variable, registryResult, languagesResult, registryDetails] =
		await Promise.all([
			metadataPromise,
			variablePromise,
			registryResultPromise,
			languagesResultPromise,
			registryDetailsPromise,
		]);
	const { capabilitySource, symbolsResult, capabilitiesResult } =
		registryDetails;
	const { staticCSS, variableCSS } = getFontPreviewCSS(metadata, variable);
	const registryUnavailable =
		registryResult.unavailable || languagesResult.unavailable;
	const familyLanguages = selectRegistryFamilyLanguages(
		registryResult.value,
		languagesResult.value,
	);

	return data(
		{
			metadata,
			staticCSS,
			variableCSS,
			registry: registryResult.value,
			languages: familyLanguages,
			symbols: symbolsResult.value,
			capabilities: capabilitiesResult.value,
			capabilitySource,
			registryUnavailable,
			capabilitiesUnavailable: capabilitiesResult.unavailable,
			symbolsUnavailable: symbolsResult.unavailable,
		},
		{ headers: cacheHeaders.short },
	);
};

export const meta: MetaFunction<typeof loader> = ({ loaderData }) =>
	ogMeta({
		title: loaderData?.metadata.family
			? `${loaderData.metadata.family} glyphs | Fontsource`
			: 'Explore font glyphs | Fontsource',
		description: loaderData?.metadata.family
			? `Browse glyphs, symbols, and language metadata for ${loaderData.metadata.family}.`
			: undefined,
		image: loaderData?.metadata
			? getFontOpenGraphImage(loaderData.metadata)
			: undefined,
	});

export default function GlyphsPage() {
	const {
		metadata,
		staticCSS,
		variableCSS,
		registry,
		languages,
		symbols,
		capabilities,
		capabilitySource,
		registryUnavailable,
		capabilitiesUnavailable,
		symbolsUnavailable,
	} = useLoaderData<typeof loader>();

	return (
		<TabsWrapper
			metadata={metadata}
			registry={registry}
			variableAvailable={Boolean(variableCSS)}
			tabsValue="glyphs"
		>
			<CharacterExplorer
				key={metadata.id}
				metadata={metadata}
				staticCSS={staticCSS}
				variableCSS={variableCSS}
				registry={registry}
				languages={languages}
				symbols={symbols}
				capabilities={capabilities}
				capabilitySource={capabilitySource}
				registryUnavailable={registryUnavailable}
				capabilitiesUnavailable={capabilitiesUnavailable}
				symbolsUnavailable={symbolsUnavailable}
			/>
		</TabsWrapper>
	);
}
