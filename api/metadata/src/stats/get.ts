import { type VersionResponse } from 'common-api/types';

import { type TTLMetadata } from '../types';
import { type StatsResponseAll } from './types';
import { updatePackageStat, updateVersion } from './update';

export const getOrUpdateVersion = async (
	id: string,
	isVariable: boolean,
	env: Env,
	ctx: ExecutionContext,
) => {
	const key = `version:${id}`;
	const { value, metadata } = await env.STATS.getWithMetadata<
		VersionResponse,
		TTLMetadata
	>(key, {
		type: 'json',
	});

	if (!value) {
		return await updateVersion(id, isVariable, env, ctx);
	}

	if (!metadata?.ttl || metadata.ttl < Date.now() / 1000) {
		ctx.waitUntil(updateVersion(id, isVariable, env, ctx));
	}

	return value;
};

export const getOrUpdatePackageStat = async (
	id: string,
	env: Env,
	ctx: ExecutionContext,
) => {
	const key = `package:${id}`;
	const { value, metadata } = await env.STATS.getWithMetadata<
		StatsResponseAll,
		TTLMetadata
	>(key, {
		type: 'json',
	});

	if (!value) {
		return await updatePackageStat(id, env, ctx);
	}

	if (!metadata?.ttl || metadata.ttl < Date.now() / 1000) {
		ctx.waitUntil(updatePackageStat(id, env, ctx));
	}

	return value;
};
