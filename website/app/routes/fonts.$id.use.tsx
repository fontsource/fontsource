import type {
	LoaderFunctionArgs,
	MetaFunction,
	ShouldRevalidateFunctionArgs,
} from 'react-router';
import { data, useLoaderData } from 'react-router';
import invariant from 'tiny-invariant';
import { FamilyPageShell } from '@/components/font-page/FamilyPageShell';
import { FamilyUse } from '@/components/font-page/FamilyUse';
import { getFontVersions, getRegistrySubset } from '@/generated/api';
import { cacheHeaders } from '@/utils/cache';
import { loadFontPageBase } from '@/utils/font-page.server';
import { getFontOpenGraphImage, ogMeta } from '@/utils/meta';

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
	const { id } = params;
	invariant(id, 'Missing font ID!');
	const basePromise = loadFontPageBase(id, request.signal);
	const subsetDefinitionsPromise = basePromise.then(async (base) => {
		const characters = base.registry.distribution.characters;
		if (characters?.type !== 'subsets') {
			return [];
		}
		const slicing = characters.slicing;
		const slicingSubset = characters.slicingSubset;
		if (!slicing || !slicingSubset) return [];
		const definition = await getRegistrySubset(
			{ id: slicing },
			{ signal: request.signal },
		);
		return [{ ...definition, id: slicingSubset }];
	});
	const [base, subsetDefinitions, versions] = await Promise.all([
		basePromise,
		subsetDefinitionsPromise,
		getFontVersions({ id }, { signal: request.signal }),
	]);

	return data(
		{
			...base,
			versions,
			subsetDefinitions,
		},
		{ headers: cacheHeaders.short },
	);
};

export const shouldRevalidate = ({
	currentUrl,
	nextUrl,
	formMethod,
	defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) => {
	const isSearchOnlyNavigation =
		!formMethod &&
		currentUrl.pathname === nextUrl.pathname &&
		currentUrl.search !== nextUrl.search;

	return isSearchOnlyNavigation ? false : defaultShouldRevalidate;
};

export const meta: MetaFunction<typeof loader> = ({ loaderData }) => {
	const family = loaderData?.metadata.family;
	return ogMeta({
		title: family ? `Download ${family} Font | Fontsource` : undefined,
		description: family
			? `Download ${family} in TTF, WOFF, and WOFF2 formats with CSS. Self-host with npm packages, or use a CDN.`
			: undefined,
		image: loaderData?.metadata
			? getFontOpenGraphImage(loaderData.metadata)
			: undefined,
	});
};

export default function UsePage() {
	const {
		metadata,
		previewCSS,
		variable,
		versions,
		registry,
		subsetDefinitions,
	} = useLoaderData<typeof loader>();

	return (
		<FamilyPageShell
			metadata={metadata}
			registry={registry}
			variable={variable}
			tabsValue="use"
		>
			<FamilyUse
				key={metadata.id}
				metadata={metadata}
				previewCSS={previewCSS}
				variable={variable}
				versions={versions}
				registry={registry}
				subsetDefinitions={subsetDefinitions}
			/>
		</FamilyPageShell>
	);
}
