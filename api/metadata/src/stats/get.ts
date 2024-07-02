import type { VersionResponse } from 'common-api/types';

import { KV_TTL, METADATA_KEYS } from '../utils';
import type { StatsResponseAllRecord } from './types';
import { updatePackageStatAll, updateVersion } from './update';

export const getVersion = async (
	id: string,
	isVariable: boolean,
	env: Env,
	ctx: ExecutionContext,
) => {
	const value = await env.VERSIONS.get<VersionResponse>(
		METADATA_KEYS.version(id),
		{
			type: 'json',
			cacheTtl: KV_TTL,
		},
	);

	if (!value) {
		return await updateVersion(id, isVariable, env, ctx);
	}

	return value;
};

export const getPackageStatAll = async (env: Env, ctx: ExecutionContext) => {
	const value = await env.METADATA.get<StatsResponseAllRecord>(
		METADATA_KEYS.downloads,
		{
			type: 'json',
			cacheTtl: KV_TTL,
		},
	);

	if (!value) {
		return await updatePackageStatAll(env, ctx);
	}

	return value;
};

export const getPackageStat = async (
	id: string,
	env: Env,
	ctx: ExecutionContext,
) => {
	const value = await getPackageStatAll(env, ctx);
	if (!value[id]) {
		return;
	}

	return value[id];
};
