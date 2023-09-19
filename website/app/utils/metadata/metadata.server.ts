import type {
	AxisRegistryAll,
	Metadata,
	StatsResponseAll,
	VariableData,
} from '@/utils/types';
import { kya } from '@/utils/utils.server';

const FONTLIST_URL = 'https://api.fontsource.org/fontlist';
const METADATA_URL = 'https://api.fontsource.org/v1/fonts/';
const FULL_METADATA_URL = 'https://api.fontsource.org/v1/fonts';
const VARIABLE_URL = (id: string) =>
	`https://api.fontsource.org/v1/variable/${id}`;
const AXIS_REGISTRY_URL = 'https://api.fontsource.org/v1/axis-registry';
const STATS_URL = (id: string) => `https://api.fontsource.org/v1/stats/${id}`;

const getFontlist = async (): Promise<Record<string, string>> =>
	await kya(FONTLIST_URL);
const getMetadata = async (id: string): Promise<Metadata> =>
	await kya(METADATA_URL + id);

const getFullMetadata = async (): Promise<Record<string, Metadata>> => {
	const metadataArr: Metadata[] = await kya(FULL_METADATA_URL);
	const metadata: Record<string, Metadata> = {};

	for (const item of metadataArr) {
		metadata[item.id] = item;
	}

	return metadata;
};

const getVariable = async (id: string): Promise<VariableData> =>
	await kya(VARIABLE_URL(id));

const getAxisRegistry = async (): Promise<AxisRegistryAll> =>
	await kya(AXIS_REGISTRY_URL);

const getStats = async (id: string): Promise<StatsResponseAll> =>
	await kya(STATS_URL(id));

export {
	getAxisRegistry,
	getFontlist,
	getFullMetadata,
	getMetadata,
	getStats,
	getVariable,
};
