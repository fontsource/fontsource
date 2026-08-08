import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data, useLoaderData } from 'react-router';
import invariant from 'tiny-invariant';
import { FamilyPageShell } from '@/components/font-page/FamilyPageShell';
import { FamilyUse } from '@/components/font-page/FamilyUse';
import { getFontVersions, getRegistrySubset } from '@/generated/api';
import { cacheHeaders } from '@/utils/cache';
import {
	loadFontPageBase,
	loadFontPageLanguages,
} from '@/utils/font-page.server';
import { getFontOpenGraphImage, ogMeta } from '@/utils/meta';

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
	const { id } = params;
	invariant(id, 'Missing font ID!');
	const basePromise = loadFontPageBase(id, request.signal);
	const subsetDefinitionsPromise = basePromise.then(async (base) => {
		const characters = base.registry?.distribution.characters;
		if (base.registryState !== 'available' || characters?.type !== 'subsets') {
			return [];
		}
		const slicing = characters.slicing;
		if (!slicing) return [];
		const slicingTokens = slicing
			.split('-')
			.filter((token) => token !== 'web')
			.sort()
			.join('-');
		const slicedSubset = characters.subsets.find(
			(subset) => subset.id.split('-').sort().join('-') === slicingTokens,
		);
		if (!slicedSubset) return [];
		try {
			const definition = await getRegistrySubset(
				{ id: slicing },
				{ signal: request.signal },
			);
			return [{ ...definition, id: slicedSubset.id }];
		} catch (error) {
			if (request.signal.aborted) throw error;
			return [];
		}
	});
	const [base, versions, languagesResult, subsetDefinitions] =
		await Promise.all([
			basePromise,
			getFontVersions({ id }, { signal: request.signal }),
			loadFontPageLanguages(basePromise, request.signal),
			subsetDefinitionsPromise,
		]);

	return data(
		{
			...base,
			versions,
			languages: languagesResult.languages,
			subsetDefinitions,
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
		registryState,
		languages,
		subsetDefinitions,
	} = useLoaderData<typeof loader>();

	return (
		<FamilyPageShell
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
				registryState={registryState}
				languages={languages}
				subsetDefinitions={subsetDefinitions}
			/>
		</FamilyPageShell>
	);
}
