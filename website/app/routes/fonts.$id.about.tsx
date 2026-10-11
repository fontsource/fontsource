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
import { getFontPreviewCSS } from '@/utils/font-preview';
import { getFontSummary } from '@/utils/font-summary.server';
import { getFontOpenGraphImage, ogMeta } from '@/utils/meta';
import {
	getRegistryContent,
	selectRegistryFamilyLanguages,
} from '@/utils/registry';
import { loadRequiredRegistryData } from '@/utils/registry-request.server';

const compactNumber = new Intl.NumberFormat('en', {
	notation: 'compact',
	maximumFractionDigits: 2,
});

const exactNumber = new Intl.NumberFormat('en');

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
	const { id } = params;
	invariant(id, 'Missing font ID!');
	const basePromise = loadFontPageBase(id, request.signal);
	const options = { signal: request.signal };
	const [
		base,
		languages,
		axesResult,
		taxonomyResult,
		capabilitiesResult,
		stats,
	] = await Promise.all([
		basePromise,
		loadFontPageLanguages(request.signal),
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
	// Format once on the server: older Safari versions round compact numbers differently.
	const monthlyUsage = stats
		? [
				{
					provider: 'npm',
					value: stats.total.npmDownloadMonthly,
					unit: 'downloads',
				},
				{
					provider: 'jsDelivr',
					value: stats.total.jsDelivrHitsMonthly,
					unit: 'requests',
				},
			]
				.filter(({ value }) => value > 0)
				.map(({ provider, value, unit }) => ({
					provider,
					compact: compactNumber.format(value),
					exact: exactNumber.format(value),
					unit,
				}))
		: [];
	return data(
		{
			...base,
			previewCSS: getFontPreviewCSS(base.metadata, base.variable),
			fontSummary: getFontSummary(
				base.metadata,
				getRegistryContent(base.registry)?.description,
				base.registry.designer,
			),
			languages: selectRegistryFamilyLanguages(base.registry, languages),
			axisRegistry: axesResult,
			taxonomy: taxonomyResult,
			capabilities: capabilitiesResult.capabilities,
			monthlyUsage,
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
		monthlyUsage,
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
				monthlyUsage={monthlyUsage}
			/>
		</FamilyPageShell>
	);
}
