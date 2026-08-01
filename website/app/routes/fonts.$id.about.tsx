import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data, useLoaderData } from 'react-router';
import invariant from 'tiny-invariant';

import { FamilyAbout } from '@/components/font-page/FamilyAbout';
import { FamilyPageShell } from '@/components/font-page/FamilyPageShell';
import { getRegistryTaxonomy, listRegistryAxes } from '@/generated/api';
import { cacheHeaders } from '@/utils/cache';
import {
	loadFontPageBase,
	loadFontPageCapabilities,
	loadFontPageLanguages,
	loadOptional,
} from '@/utils/font-page.server';
import { getFontOpenGraphImage, ogMeta } from '@/utils/meta';

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
	const { id } = params;
	invariant(id, 'Missing font ID!');
	const basePromise = loadFontPageBase(id, request.signal);
	const options = { signal: request.signal };
	const [
		base,
		languagesResult,
		axesResult,
		taxonomyResult,
		capabilitiesResult,
	] = await Promise.all([
		basePromise,
		loadFontPageLanguages(basePromise, request.signal),
		loadOptional(listRegistryAxes(options)),
		loadOptional(getRegistryTaxonomy(options)),
		loadFontPageCapabilities(basePromise, request.signal),
	]);
	const enrichmentUnavailable = [
		languagesResult,
		axesResult,
		taxonomyResult,
	].some((result) => result.unavailable);

	return data(
		{
			...base,
			languages: languagesResult.languages,
			axisRegistry: axesResult.value,
			taxonomy: taxonomyResult.value,
			capabilities: capabilitiesResult.capabilities,
			capabilitySource: capabilitiesResult.capabilitySource,
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
		<FamilyPageShell
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
		</FamilyPageShell>
	);
}
