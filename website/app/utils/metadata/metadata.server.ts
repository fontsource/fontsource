import type { Metadata } from '@/utils/types';
import { kya } from '@/utils/utils.server';

const FONTLIST_URL = 'https://api.fontsource.org/fontlist';
const METADATA_URL = 'https://api.fontsource.org/v1/fonts/';
const FULL_METADATA_URL = 'https://api.fontsource.org/v1/fonts';

const getFontlist = async (): Promise<Record<string, string>> => {
	const fontlist = await kya(FONTLIST_URL);

	return fontlist;
};

const getMetadata = async (id: string): Promise<Metadata> => {
	const metadata: Metadata = await kya(METADATA_URL + id);
	return metadata;
};

const getFullMetadata = async (): Promise<Record<string, Metadata>> => {
	const metadataArr: Metadata[] = await kya(FULL_METADATA_URL);
	const metadata: Record<string, Metadata> = {};

	for (const item of metadataArr) {
		metadata[item.id] = item;
	}

	return metadata;
};

export { getFontlist, getFullMetadata, getMetadata };
