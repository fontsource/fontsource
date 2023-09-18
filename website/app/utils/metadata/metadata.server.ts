import type { AxisRegistryAll, Metadata, VariableData } from '@/utils/types';
import { kya } from '@/utils/utils.server';

const FONTLIST_URL = 'https://api.fontsource.org/fontlist';
const METADATA_URL = 'https://api.fontsource.org/v1/fonts/';
const FULL_METADATA_URL = 'https://api.fontsource.org/v1/fonts';
const VARIABLE_URL = (id: string) =>
	`https://api.fontsource.org/v1/variable/${id}`;
const AXIS_REGISTRY_URL = 'https://api.fontsource.org/v1/axis-registry';

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

const getVariable = async (id: string): Promise<VariableData> => {
	return await kya(VARIABLE_URL(id));
};

const getAxisRegistry = async (): Promise<AxisRegistryAll> => {
	return await kya(AXIS_REGISTRY_URL);
};

export {
	getAxisRegistry,
	getFontlist,
	getFullMetadata,
	getMetadata,
	getVariable,
};
