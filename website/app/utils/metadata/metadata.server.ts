import type { Metadata } from '@/utils/types';
import { kya } from '@/utils/utils.server';

const FONTLIST_URL = 'https://api.fontsource.org/fontlist';
const METADATA_URL = 'https://api.fontsource.org/v1/fonts/';

const getFontlist = async (): Promise<Record<string, string>> => {
	const fontlist = await kya(FONTLIST_URL);

	return fontlist;
};

const getMetadata = async (id: string): Promise<Metadata> => {
	const metadata: Metadata = await kya(METADATA_URL + id);

	return metadata;
};

export { getFontlist, getMetadata };
