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
	loadFontPageStats,
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
	const [
		base,
		languagesResult,
		axesResult,
		taxonomyResult,
		capabilitiesResult,
		stats,
	] = await Promise.all([
		basePromise,
		loadFontPageLanguages(basePromise, request.signal),
		loadRequiredRegistryData(
			listRegistryAxes(options),
			request.signal,
			'Variable axis data',
		),
		loadRequiredRegistryData(
			getRegistryTaxonomy(options),
			request.signal,
			'Font taxonomy',
		),
		loadFontPageCapabilities(basePromise, request.signal),
		loadFontPageStats(id, request.signal),
	]);
	return data(
		{
			...base,
			fontSummary: getFontSummary(
				base.metadata,
				getRegistryContent(base.registry)?.description,
				base.registry.designer,
			),
			languages: languagesResult.languages ?? [],
			axisRegistry: axesResult,
			taxonomy: taxonomyResult,
			capabilities: capabilitiesResult.capabilities,
			stats,
		},
		{ headers: cacheHeaders.short },
	);
};

export const meta: MetaFunction<typeof loader> = ({ loaderData }) =>
	ogMeta({
		title: loaderData?.metadata.family
			? `${loaderData.metadata.family} — Font Details & License | Fontsource`
			: 'About This Font | Fontsource',
		description: loaderData?.metadata.family
			? `${loaderData.fontSummary} Explore its design, language support, and license.`
			: undefined,
		image: loaderData?.metadata
			? getFontOpenGraphImage(loaderData.metadata)
			: undefined,
	});

export default function AboutPage() {
	const {
		metadata,
		previewCSS,
		variable,
		registry,
		languages,
		axisRegistry,
		taxonomy,
		capabilities,
		stats,
	} = useLoaderData<typeof loader>();

	return (
		<FamilyPageShell
			metadata={metadata}
			registry={registry}
			variable={variable}
			tabsValue="about"
		>
			<FamilyAbout
				key={metadata.id}
				metadata={metadata}
				previewCSS={previewCSS}
				variable={variable}
				registry={registry}
				languages={languages}
				axisRegistry={axisRegistry}
				taxonomy={taxonomy}
				capabilities={capabilities}
				stats={stats}
			/>
		</FamilyPageShell>
	);
}
