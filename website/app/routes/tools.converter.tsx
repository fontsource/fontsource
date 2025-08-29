import type { MetaFunction } from 'react-router';
import { FontConverter } from '@/components/fontConverter/FontConverter';
import { ogMeta } from '@/utils/meta';

export const meta: MetaFunction = () => {
	const title = 'Font Converter Tool | Fontsource';
	const description =
		'Convert TTF, WOFF, and WOFF2 files quickly and securely in your browser. A free tool for optimizing web fonts.';

	return ogMeta({ title, description });
};

export const ConverterPage = () => {
	return <FontConverter />;
};

export default ConverterPage;
