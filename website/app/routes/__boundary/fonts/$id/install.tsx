import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import invariant from 'tiny-invariant';

import { Install } from '@/components/preview/Install';
import { TabsWrapper } from '@/components/preview/Tabs';
import { getDownloadCountTotal } from '@/utils/metadata/download.server';
import { getMetadata } from '@/utils/metadata/metadata.server';
import { getVariable } from '@/utils/metadata/variable.server';
import type { Metadata, VariableData } from '@/utils/types';

export const loader: LoaderFunction = async ({ params }) => {
	const { id } = params;
	console.log('id', id);
	invariant(id, 'Missing font ID!');
	const metadata = await getMetadata(id);
	let variable;
	if (metadata.variable) {
		variable = await getVariable(id);
	}
	const downloadCount = await getDownloadCountTotal(id);

	return json({
		metadata,
		variable,
		downloadCount,
	});
};

interface FontMetadata {
	metadata: Metadata;
	variable: VariableData;
	downloadCount: number;
}

export default function InstallPage() {
	const data: FontMetadata = useLoaderData();
	const { metadata, variable, downloadCount } = data;

	return (
		<TabsWrapper metadata={metadata} tabsValue="install">
			<Install
				metadata={metadata}
				variable={variable}
				downloadCount={downloadCount}
			/>
		</TabsWrapper>
	);
}
