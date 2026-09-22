import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data, useLoaderData } from 'react-router';
import invariant from 'tiny-invariant';
import { FamilyPageShell } from '@/components/font-page/FamilyPageShell';
import { FamilyPreview } from '@/components/font-page/FamilyPreview';
import { listRegistryAxes } from '@/generated/api';
import { cacheHeaders } from '@/utils/cache';
import {
	loadFontPageBase,
	loadFontPageCapabilities,
	loadFontPageLanguages,
	loadFontPageSymbols,
} from '@/utils/font-page.server';
import { getFontSummary } from '@/utils/font-summary.server';
import { getFontOpenGraphImage, ogMeta } from '@/utils/meta';
import { getRegistryContent } from '@/utils/registry';
import { loadRequiredRegistryData } from '@/utils/registry-request.server';

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
	const { id } = params;
	invariant(id, 'Missing font ID!');
	const basePromise = loadFontPageBase(id, request.signal);
	const options = { signal: request.signal };
	const [base, languagesResult, axesResult, capabilitiesResult, symbolsResult] =
		await Promise.all([
			basePromise,
			loadFontPageLanguages(basePromise, request.signal, 'all'),
			loadRequiredRegistryData(
				listRegistryAxes(options),
				request.signal,
				'Variable axis data',
			),
			loadFontPageCapabilities(basePromise, request.signal),
			loadFontPageSymbols(basePromise, request.signal),
		]);

	return data(
		{
			...base,
			fontSummary: getFontSummary(
				base.metadata,
				getRegistryContent(base.registry)?.description,
				base.registry.designer,
			),
			languages: languagesResult.languages,
			axisRegistry: axesResult,
			capabilities: capabilitiesResult.capabilities,
			capabilitySource: capabilitiesResult.capabilitySource,
			symbols: symbolsResult.symbols,
		},
		{ headers: cacheHeaders.short },
	);
};

export const meta: MetaFunction<typeof loader> = ({ loaderData }) => {
	const title = loaderData?.metadata.family
		? `${loaderData.metadata.family} — Font Preview & Download | Fontsource`
		: 'Fontsource';

	const description = loaderData?.metadata
		? `${loaderData.fontSummary} Preview your text, download${loaderData.metadata.variable ? ' this variable font' : ' the font'}, or self-host it on your website.`
		: undefined;
	const image = loaderData?.metadata
		? getFontOpenGraphImage(loaderData.metadata)
		: undefined;
	return ogMeta({ title, description, image });
};

export default function Font() {
	const {
		metadata,
		previewCSS,
		variable,
		registry,
		languages,
		axisRegistry,
		capabilities,
		capabilitySource,
		symbols,
	} = useLoaderData<typeof loader>();

	return (
		<FamilyPageShell
			metadata={metadata}
			registry={registry}
			variable={variable}
			tabsValue="preview"
		>
			<FamilyPreview
				key={metadata.id}
				metadata={metadata}
				previewCSS={previewCSS}
				variable={variable}
				registry={registry}
				languages={languages}
				axisRegistry={axisRegistry}
				capabilities={capabilities}
				capabilitySource={capabilitySource}
				symbols={symbols}
			/>
		</FamilyPageShell>
	);
}
