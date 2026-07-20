import type { MetaFunction } from 'react-router';
import { FontWorkbench } from '@/components/tools/FontWorkbench';
import { ogMeta } from '@/utils/meta';

export const meta: MetaFunction = () => {
	const title = 'Free Font Converter - WOFF2, WOFF, TTF & OTF | Fontsource';
	const description =
		'A free tool for web developers to convert TTF, OTF, WOFF, and WOFF2 files to optimized web formats. All processing is done client-side in your browser for speed and privacy. No server uploads.';

	return ogMeta({ title, description });
};

export const ConverterPage = () => {
	return <FontWorkbench preset="converter" />;
};

export default ConverterPage;
