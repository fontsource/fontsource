export interface AxisRegistryEntry {
	name: string;
	description: string;
	min: number;
	max: number;
	default: number;
	precision: number;
}

export type AxisRegistry = Record<string, AxisRegistryEntry>;
export type AxisRegistryItem = AxisRegistryEntry & { tag: string };

export const buildAxisRegistry = (
	entries: readonly AxisRegistryItem[],
): AxisRegistry =>
	entries.reduce<AxisRegistry>((accumulator, entry) => {
		const { tag, ...rest } = entry;
		accumulator[tag] = rest;
		return accumulator;
	}, {});
