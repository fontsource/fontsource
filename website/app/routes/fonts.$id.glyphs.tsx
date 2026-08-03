import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data, useLoaderData } from 'react-router';
import invariant from 'tiny-invariant';

import { CharacterExplorer } from '@/components/font-page/CharacterExplorer';
import { FamilyPageShell } from '@/components/font-page/FamilyPageShell';
import { cacheHeaders } from '@/utils/cache';
import {
	loadFontPageBase,
	loadFontPageCapabilities,
	loadFontPageLanguages,
	loadFontPageSymbols,
} from '@/utils/font-page.server';
import { getFontOpenGraphImage, ogMeta } from '@/utils/meta';

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
	const { id } = params;
	invariant(id, 'Missing font ID!');
	const basePromise = loadFontPageBase(id, request.signal);
	const [base, languagesResult, capabilitiesResult, symbolsResult] =
		await Promise.all([
			basePromise,
			loadFontPageLanguages(basePromise, request.signal),
			loadFontPageCapabilities(basePromise, request.signal),
			loadFontPageSymbols(basePromise, request.signal),
		]);

	return data(
		{
			...base,
			languages: languagesResult.languages,
			symbols: symbolsResult.symbols,
			capabilities: capabilitiesResult.capabilities,
			capabilitySource: capabilitiesResult.capabilitySource,
			capabilitiesState: capabilitiesResult.state,
			symbolsState: symbolsResult.state,
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
			? `Browse, inspect, and copy mapped glyphs and symbols from ${loaderData.metadata.family}.`
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
		capabilitiesState,
		symbolsState,
	} = useLoaderData<typeof loader>();

	return (
		<FamilyPageShell
			metadata={metadata}
			registry={registry}
			previewSource={capabilitySource}
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
				capabilitiesState={capabilitiesState}
				symbolsState={symbolsState}
			/>
		</FamilyPageShell>
	);
}
