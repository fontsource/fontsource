import { StatusError } from 'itty-router';

import { AXIS_REGISTRY_URL, KV_TTL, VARIABLE_URL } from '../utils';
import {
	type AxisRegistry,
	type VariableMetadata,
	type VariableMetadataWithVariants,
} from './types';

export const updateVariableList = async (env: Env, ctx: ExecutionContext) => {
	const resp = await fetch(VARIABLE_URL);
	if (!resp.ok) {
		const text = await resp.text();
		throw new StatusError(
			resp.status,
			`Failed to fetch variable metadata. ${text}`,
		);
	}
	const data = await resp.json<Record<string, VariableMetadataWithVariants>>();

	// Remove variants property from all fonts
	const noVariants: Record<string, VariableMetadata> = {};
	for (const [key, value] of Object.entries(data)) {
		const { variants, ...rest } = value;
		noVariants[key] = rest;
	}

	// Save entire metadata into KV first
	ctx.waitUntil(
		env.VARIABLE_LIST.put('metadata', JSON.stringify(noVariants), {
			metadata: {
				// We need to set a custom ttl for a stale-while-revalidate strategy
				ttl: Date.now() + KV_TTL,
			},
		}),
	);

	return data;
};

export const updateVariable = async (
	id: string,
	env: Env,
	ctx: ExecutionContext,
) => {
	const resp = await fetch(VARIABLE_URL);
	if (!resp.ok) {
		const text = await resp.text();
		throw new StatusError(
			resp.status,
			`Failed to fetch variable item metadata. ${text}`,
		);
	}
	const data = await resp.json<Record<string, VariableMetadataWithVariants>>();
	const dataId = data[id];

	if (!dataId) {
		// eslint-disable-next-line unicorn/no-null
		return null;
	}

	// Save entire metadata into KV first
	ctx.waitUntil(
		env.VARIABLE.put(id, JSON.stringify(dataId), {
			metadata: {
				// We need to set a custom ttl for a stale-while-revalidate strategy
				ttl: Date.now() + KV_TTL,
			},
		}),
	);

	return dataId;
};

export const updateAxisRegistry = async (env: Env, ctx: ExecutionContext) => {
	const resp = await fetch(AXIS_REGISTRY_URL);
	if (!resp.ok) {
		const text = await resp.text();
		throw new StatusError(
			resp.status,
			`Failed to fetch axis registry metadata. ${text}`,
		);
	}
	const data = await resp.json<AxisRegistry>();

	// Save entire metadata into KV first
	ctx.waitUntil(
		env.VARIABLE.put('axis_registry', JSON.stringify(data), {
			metadata: {
				// We need to set a custom ttl for a stale-while-revalidate strategy
				ttl: Date.now() + KV_TTL,
			},
		}),
	);

	return data;
};
