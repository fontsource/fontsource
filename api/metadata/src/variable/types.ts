interface AxesData {
	default: string;
	min: string;
	max: string;
	step: string;
}

// axes: italic: link
type VariableVariants = Record<string, Record<string, string>>;

interface VariableMetadata {
	family: string;
	id: string;
	axes: Record<string, AxesData>;
}

interface VariableMetadataWithVariants extends VariableMetadata {
	variants: VariableVariants;
}

type VariableList = Record<string, VariableMetadata>;

interface AxisRegistryItem {
	name: string;
	tag: string;
	description: string;
	min: number;
	max: number;
	default: number;
	precision: number;
}

type AxisRegistryDownload = AxisRegistryItem[];
type AxisRegistry = Record<string, Omit<AxisRegistryItem, 'tag'>>;

const axisRegistryQueries = ['name', 'tag'] as const;
type AxisRegistryQueries = (typeof axisRegistryQueries)[number];
const isAxisRegistryQuery = (x: string): x is AxisRegistryQueries =>
	axisRegistryQueries.includes(x as AxisRegistryQueries);

export type {
	AxisRegistry,
	AxisRegistryDownload,
	VariableList,
	VariableMetadata,
	VariableMetadataWithVariants,
};

export { isAxisRegistryQuery };
