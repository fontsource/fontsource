import { KV_TTL, METADATA_KEYS } from '../utils';
import type { AxisRegistry, VariableList } from './types';
import { updateAxisRegistry, updateVariableList } from './update';

export const getVariableList = async (env: Env, ctx: ExecutionContext) => {
	const value = await env.METADATA.get<VariableList>(
		METADATA_KEYS.variable_list,
		{
			type: 'json',
			cacheTtl: KV_TTL,
		},
	);

	if (!value) {
		return await updateVariableList(env, ctx);
	}

	return value;
};

export const getVariableId = async (
	id: string,
	env: Env,
	ctx: ExecutionContext,
) => {
	const data = await getVariableList(env, ctx);

	if (!data[id]) {
		return;
	}

	return data[id];
};

export const getAxisRegistry = async (env: Env, ctx: ExecutionContext) => {
	const value = await env.METADATA.get<AxisRegistry>(
		METADATA_KEYS.axisRegistry,
		{
			type: 'json',
			cacheTtl: KV_TTL,
		},
	);

	if (!value) {
		return await updateAxisRegistry(env, ctx);
	}

	return value;
};
