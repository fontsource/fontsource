import type {
	AxisRegistryAll,
	Metadata,
	StatsResponseAll,
	VariableData,
} from '@/utils/types';

const FONTLIST_URL = 'https://api.fontsource.org/fontlist';
const METADATA_URL = 'https://api.fontsource.org/v1/fonts/';
const FULL_METADATA_URL = 'https://api.fontsource.org/v1/fonts';
const VARIABLE_URL = (id: string) =>
	`https://api.fontsource.org/v1/variable/${id}`;
const AXIS_REGISTRY_URL = 'https://api.fontsource.org/v1/axis-registry';
const STATS_URL = (id: string) => `https://api.fontsource.org/v1/stats/${id}`;

const getFontlist = async (): Promise<Record<string, string>> =>
	await fetch(FONTLIST_URL).then((res) => res.json());
const getMetadata = async (id: string): Promise<Metadata> =>
	await fetch(METADATA_URL + id).then((res) => res.json());

const getFullMetadata = async (): Promise<Record<string, Metadata>> => {
	const metadataArr: Metadata[] = await fetch(FULL_METADATA_URL).then((res) =>
		res.json(),
	);
	const metadata: Record<string, Metadata> = {};

	for (const item of metadataArr) {
		metadata[item.id] = item;
	}

	return metadata;
};

const getVariable = async (id: string): Promise<VariableData> =>
	await fetch(VARIABLE_URL(id)).then((res) => res.json());

const getAxisRegistry = async (): Promise<AxisRegistryAll> =>
	await fetch(AXIS_REGISTRY_URL).then((res) => res.json());

const getStats = async (id: string): Promise<StatsResponseAll> =>
	await fetch(STATS_URL(id)).then((res) => res.json());

export {
	getAxisRegistry,
	getFontlist,
	getFullMetadata,
	getMetadata,
	getStats,
	getVariable,
};
