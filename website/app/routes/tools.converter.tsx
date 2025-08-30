import { Stack } from '@mantine/core';
import type { MetaFunction } from 'react-router';
import { FontConverter } from '@/components/tools/FontConverter';
import { ogMeta } from '@/utils/meta';

export const meta: MetaFunction = () => {
	const title = 'Free Font Converter - WOFF2, WOFF, TTF & OTF | Fontsource';
	const description =
		'A free tool for web developers to convert TTF, OTF, WOFF, and WOFF2 files to optimized web formats. All processing is done client-side in your browser for speed and privacy. No server uploads.';

	return ogMeta({ title, description });
};

export const ConverterPage = () => {
	return (
		<Stack gap="xl">
			<FontConverter />
		</Stack>
	);
};

export default ConverterPage;
