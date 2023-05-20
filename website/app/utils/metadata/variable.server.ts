import { knex } from '@/utils/db.server';
import { ensurePrimary } from '@/utils/fly.server';
import type { AxisRegistry, AxisRegistryAll } from '@/utils/types';
import { kya } from '@/utils/utils.server';

const getVariable = async (id: string) => {
	const variable = await knex('variable').where({ id }).first();
	if (!variable) return null;
	return JSON.parse(variable.axes);
};

const getAxisRegistry = async (): Promise<AxisRegistryAll> => {
	const axisRegistry = await knex('axis_registry').select('*');
	const registry: AxisRegistryAll = {};
	for (const axis of axisRegistry) {
		registry[axis.tag] = {
			name: axis.name,
			description: axis.description,
			min: axis.min,
			max: axis.max,
			default: axis.default,
			precision: axis.precision,
		};
	}
	return registry;
};

const updateAxisRegistry = async () => {
	await ensurePrimary();

	const AXIS_URL =
		'https://raw.githubusercontent.com/fontsource/font-files/main/metadata/axis-registry.json';

	const axisRegistry = (await kya(AXIS_URL)) as AxisRegistry[];
	for (const axis of axisRegistry) {
		await knex('axis_registry')
			.insert({
				tag: axis.tag,
				name: axis.name,
				description: axis.description,
				min: axis.min,
				max: axis.max,
				default: axis.default,
				precision: axis.precision,
			})
			.onConflict('tag')
			.merge();
	}
};

export { getAxisRegistry, getVariable, updateAxisRegistry };
