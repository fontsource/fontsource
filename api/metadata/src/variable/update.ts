import type {
	VariableMetadata,
	VariableMetadataWithVariants,
} from 'common-api/types';
import { StatusError } from 'itty-router';

import {
	AXIS_REGISTRY_URL,
	METADATA_KEYS,
	VARIABLE_ICONS_URL,
	VARIABLE_URL,
} from '../utils';
import type { AxisRegistry, AxisRegistryDownload } from './types';

export const updateVariableList = async (env: Env, ctx: ExecutionContext) => {
	const resp = await fetch(VARIABLE_URL);
	if (!resp.ok) {
		const text = await resp.text();
		throw new StatusError(
			resp.status,
			`Failed to fetch variable metadata list. ${text}`,
		);
	}
	const data = (await resp.json()) as Record<
		string,
		VariableMetadataWithVariants
	>;

	const respIcons = await fetch(VARIABLE_ICONS_URL);
	if (!respIcons.ok) {
		const text = await respIcons.text();
		throw new StatusError(
			respIcons.status,
			`Failed to fetch variable icons metadata list. ${text}`,
		);
	}
	const dataIcons = (await respIcons.json()) as Record<
		string,
		VariableMetadataWithVariants
	>;

	const dataMerged = { ...data, ...dataIcons };

	// Remove variants property from all fonts
	const noVariants: Record<string, VariableMetadata> = {};
	for (const [key, value] of Object.entries(dataMerged)) {
		const { axes, family } = value;
		noVariants[key] = { axes, family };
	}

	// Save entire metadata into KV first
	ctx.waitUntil(
		env.METADATA.put(METADATA_KEYS.variable_list, JSON.stringify(noVariants)),
	);

	return noVariants;
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
	const data = (await resp.json()) as AxisRegistryDownload;

	const registry: AxisRegistry = {};
	// Remove tag property from all fonts and use it as a key
	for (const item of data) {
		const { tag, ...rest } = item;
		registry[tag] = rest;
	}

	// Save entire metadata into KV first
	ctx.waitUntil(
		env.METADATA.put(METADATA_KEYS.axisRegistry, JSON.stringify(registry)),
	);

	return registry;
};
