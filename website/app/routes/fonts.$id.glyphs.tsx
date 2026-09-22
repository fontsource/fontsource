import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data, useLoaderData } from 'react-router';
import invariant from 'tiny-invariant';

import { CharacterExplorer } from '@/components/font-page/CharacterExplorer';
import { FamilyPageShell } from '@/components/font-page/FamilyPageShell';
import { cacheHeaders } from '@/utils/cache';
import {
	loadFontPageBase,
	loadFontPageCapabilities,
	loadFontPageSymbols,
} from '@/utils/font-page.server';
import { getFontOpenGraphImage, ogMeta } from '@/utils/meta';

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
	const { id } = params;
	invariant(id, 'Missing font ID!');
	const basePromise = loadFontPageBase(id, request.signal);
	const [base, capabilitiesResult, symbols] = await Promise.all([
		basePromise,
		loadFontPageCapabilities(basePromise, request.signal),
		loadFontPageSymbols(basePromise, request.signal),
	]);

	return data(
		{
			...base,
			symbols,
			capabilities: capabilitiesResult.capabilities,
			capabilitySource: capabilitiesResult.capabilitySource,
		},
		{ headers: cacheHeaders.short },
	);
};

export const meta: MetaFunction<typeof loader> = ({ loaderData }) =>
	ogMeta({
		title: loaderData?.metadata.family
			? `${loaderData.metadata.family} Glyph Explorer | Fontsource`
			: 'Font Glyph Explorer | Fontsource',
		description: loaderData?.metadata.family
			? `Explore ${loaderData.metadata.family} glyphs, characters, and symbols. View Unicode values and copy individual characters with the interactive glyph viewer.`
			: undefined,
		image: loaderData?.metadata
			? getFontOpenGraphImage(loaderData.metadata)
			: undefined,
	});

export default function GlyphsPage() {
	const {
		metadata,
		variable,
		registry,
		symbols,
		capabilities,
		capabilitySource,
	} = useLoaderData<typeof loader>();

	return (
		<FamilyPageShell
			metadata={metadata}
			registry={registry}
			previewSource={capabilitySource}
			variable={variable}
			tabsValue="glyphs"
		>
			<CharacterExplorer
				key={metadata.id}
				metadata={metadata}
				registry={registry}
				symbols={symbols}
				capabilities={capabilities}
				capabilitySource={capabilitySource}
			/>
		</FamilyPageShell>
	);
}
