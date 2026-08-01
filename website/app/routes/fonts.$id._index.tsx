import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data, useLoaderData } from 'react-router';
import invariant from 'tiny-invariant';
import { FamilyPageShell } from '@/components/font-page/FamilyPageShell';
import { FamilyPreview } from '@/components/font-page/FamilyPreview';
import { type GetFontResponse, getFontVersions } from '@/generated/api';
import { cacheHeaders } from '@/utils/cache';
import { loadFontPageBase } from '@/utils/font-page.server';
import { getFontOpenGraphImage, ogMeta } from '@/utils/meta';

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
	const { id } = params;
	invariant(id, 'Missing font ID!');
	const [base, versions] = await Promise.all([
		loadFontPageBase(id, request.signal),
		getFontVersions({ id }, { signal: request.signal }),
	]);

	return data({ ...base, versions }, { headers: cacheHeaders.short });
};

const generateDescription = (metadata: GetFontResponse) => {
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
		staticCSS,
		variable,
		variableCSS,
		versions,
		registry,
		registryUnavailable,
	} = useLoaderData<typeof loader>();

	return (
		<FamilyPageShell
			metadata={metadata}
			registry={registry}
			variableAvailable={Boolean(variable)}
			tabsValue="preview"
		>
			<FamilyPreview
				key={metadata.id}
				metadata={metadata}
				staticCSS={staticCSS}
				variable={variable}
				variableCSS={variableCSS}
				versions={versions}
				registry={registry}
				registryUnavailable={registryUnavailable}
				variableUnavailable={metadata.variable && !variable}
			/>
		</FamilyPageShell>
	);
}
