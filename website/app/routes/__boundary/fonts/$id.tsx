import { Box,createStyles,Title } from '@mantine/core';
import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react';
import invariant from 'tiny-invariant';

import { ContentHeader } from '@/components';
import { Configure } from '@/components/preview/Configure';
import { TextArea } from '@/components/preview/TextArea';
import { getMetadata, getVariable } from '@/utils/metadata.server';
import type { Metadata, VariableData } from '@/utils/types';

export const loader: LoaderFunction = async ({ params }) => {
	const { id } = params;
	invariant(id, 'Missing font ID!');
	const metadata = await getMetadata(id);
	let variable = undefined;
	if (metadata.variable) {
		variable = await getVariable(id);
	}

	return json({ metadata, variable });
}

interface FontMetadata {
	metadata: Metadata
	variable: VariableData
}

const useStyles = createStyles((theme) => ({
	wrapperPreview: {
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-between',
		padding: '24px',
	},
}));

export default function Font() {
	const data: FontMetadata = useLoaderData();
	const { metadata, variable } = data;
	const {classes} = useStyles();

	return (
		<>
			<ContentHeader>
			<Title order={1} color="purple">
          {metadata.family}
			</Title>
			{metadata.category} {metadata.type}
			</ContentHeader>
			<Box className={classes.wrapperPreview}>
				<TextArea metadata={metadata}/>
				<Configure metadata={metadata} variable={variable} />
			</Box>
		</>

    )
}
