import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data, useLoaderData } from 'react-router';
import invariant from 'tiny-invariant';
import { FamilyPageShell } from '@/components/font-page/FamilyPageShell';
import { FamilyUse } from '@/components/font-page/FamilyUse';
import { getFontVersions } from '@/generated/api';
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
	const { metadata, staticCSS, variable, variableCSS, versions, registry } =
		useLoaderData<typeof loader>();

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
			/>
		</FamilyPageShell>
	);
}
