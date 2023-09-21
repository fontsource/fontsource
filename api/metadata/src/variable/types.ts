import { type VariableMetadata } from 'common-api/types';

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

export type { AxisRegistry, AxisRegistryDownload, VariableList };

export { isAxisRegistryQuery };
