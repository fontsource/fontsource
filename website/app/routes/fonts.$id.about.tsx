import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data, useLoaderData } from 'react-router';
import invariant from 'tiny-invariant';

import { FamilyAbout } from '@/components/font-page/FamilyAbout';
import { TabsWrapper } from '@/components/preview/Tabs';
import {
	getFont,
	getRegistryFamily,
	getRegistrySourceCapabilities,
	getRegistryTaxonomy,
	getVariableFont,
	listRegistryAxes,
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
	const capabilityDetailsPromise = registryResultPromise.then(
		async (registryResult) => {
			const capabilitySource = selectRegistrySource(registryResult.value);
			const capabilitiesResult = capabilitySource
				? await getRegistrySourceCapabilities(
						{ sha256: capabilitySource.sha256 },
						options,
					).then(
						(value) => ({ value, unavailable: false }),
						() => ({ value: undefined, unavailable: true }),
					)
				: { value: undefined, unavailable: false };
			return { capabilitySource, capabilitiesResult };
		},
	);
	const [
		metadata,
		variable,
		registryResult,
		languagesResult,
		axesResult,
		taxonomyResult,
		capabilityDetails,
	] = await Promise.all([
		metadataPromise,
		variablePromise,
		registryResultPromise,
		listRegistryLanguages(options).then(
			(value) => ({ value, unavailable: false }),
			() => ({ value: undefined, unavailable: true }),
		),
		listRegistryAxes(options).then(
			(value) => ({ value, unavailable: false }),
			() => ({ value: undefined, unavailable: true }),
		),
		getRegistryTaxonomy(options).then(
			(value) => ({ value, unavailable: false }),
			() => ({ value: undefined, unavailable: true }),
		),
		capabilityDetailsPromise,
	]);
	const { staticCSS, variableCSS } = getFontPreviewCSS(metadata, variable);
	const registryUnavailable = registryResult.unavailable;
	const enrichmentUnavailable = [
		languagesResult,
		axesResult,
		taxonomyResult,
	].some((result) => result.unavailable);
	const { capabilitySource, capabilitiesResult } = capabilityDetails;
	const familyLanguages = selectRegistryFamilyLanguages(
		registryResult.value,
		languagesResult.value,
	);

	return data(
		{
			metadata,
			staticCSS,
			variable,
			variableCSS,
			registry: registryResult.value,
			languages: familyLanguages,
			axisRegistry: axesResult.value,
			taxonomy: taxonomyResult.value,
			capabilities: capabilitiesResult.value,
			capabilitySource,
			registryUnavailable,
			enrichmentUnavailable,
			capabilitiesUnavailable: capabilitiesResult.unavailable,
		},
		{ headers: cacheHeaders.short },
	);
};

export const meta: MetaFunction<typeof loader> = ({ loaderData }) =>
	ogMeta({
		title: loaderData?.metadata.family
			? `About ${loaderData.metadata.family} | Fontsource`
			: 'About this font | Fontsource',
		description: loaderData?.metadata.family
			? `Learn about ${loaderData.metadata.family}, its source, license, styles, and capabilities.`
			: undefined,
		image: loaderData?.metadata
			? getFontOpenGraphImage(loaderData.metadata)
			: undefined,
	});

export default function AboutPage() {
	const {
		metadata,
		staticCSS,
		variable,
		variableCSS,
		registry,
		languages,
		axisRegistry,
		taxonomy,
		capabilities,
		capabilitySource,
		registryUnavailable,
		enrichmentUnavailable,
		capabilitiesUnavailable,
	} = useLoaderData<typeof loader>();

	return (
		<TabsWrapper
			metadata={metadata}
			registry={registry}
			variableAvailable={Boolean(variable)}
			tabsValue="about"
		>
			<FamilyAbout
				key={metadata.id}
				metadata={metadata}
				staticCSS={staticCSS}
				variable={variable}
				variableCSS={variableCSS}
				registry={registry}
				languages={languages}
				axisRegistry={axisRegistry}
				taxonomy={taxonomy}
				capabilities={capabilities}
				capabilitySource={capabilitySource}
				registryUnavailable={registryUnavailable}
				enrichmentUnavailable={enrichmentUnavailable}
				capabilitiesUnavailable={capabilitiesUnavailable}
				variableUnavailable={metadata.variable && !variable}
			/>
		</TabsWrapper>
	);
}
