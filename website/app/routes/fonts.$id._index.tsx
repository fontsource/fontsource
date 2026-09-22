import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data, useLoaderData } from 'react-router';
import invariant from 'tiny-invariant';
import { FamilyPageShell } from '@/components/font-page/FamilyPageShell';
import { FamilyPreview } from '@/components/font-page/FamilyPreview';
import { type GetFontResponse, listRegistryAxes } from '@/generated/api';
import { cacheHeaders } from '@/utils/cache';
import {
	loadFontPageBase,
	loadFontPageCapabilities,
	loadFontPageLanguages,
	loadFontPageSymbols,
} from '@/utils/font-page.server';
import { getFontPreviewCSS } from '@/utils/font-preview';
import { getFontOpenGraphImage, ogMeta } from '@/utils/meta';
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

	const axisTags = new Set([
		...Object.keys(base.variable?.axes ?? {}),
		...base.registry.sources.flatMap((source) =>
			source.type === 'variable' ? source.axes.map((axis) => axis.tag) : [],
		),
	]);

	return data(
		{
			...base,
			previewCSS: getFontPreviewCSS(base.metadata, base.variable),
			languages: languagesResult.languages,
			axisRegistry: Object.fromEntries(
				Object.entries(axesResult).filter(([tag]) => axisTags.has(tag)),
			),
			capabilities: capabilitiesResult.capabilities,
			capabilitySource: capabilitiesResult.capabilitySource,
			symbolNames: symbolsResult.symbols?.map((symbol) => symbol.name),
		},
		{ headers: cacheHeaders.short },
	);
};

const generateDescription = (metadata: Omit<GetFontResponse, 'variants'>) => {
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
		previewCSS,
		variable,
		registry,
		languages,
		axisRegistry,
		capabilities,
		capabilitySource,
		symbolNames,
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
				symbolNames={symbolNames}
			/>
		</FamilyPageShell>
	);
}
