import { type TTLMetadata } from '../types';
import {
	type AxisRegistry,
	type VariableList,
	type VariableMetadataWithVariants,
} from './types';
import {
	updateAxisRegistry,
	updateVariable,
	updateVariableList,
} from './update';

export const getOrUpdateVariableList = async (
	env: Env,
	ctx: ExecutionContext,
) => {
	const { value, metadata } = await env.VARIABLE_LIST.getWithMetadata<
		VariableList,
		TTLMetadata
	>('variable_list', {
		type: 'json',
	});

	if (!value) {
		return await updateVariableList(env, ctx);
	}

	if (!metadata?.ttl || metadata.ttl < Date.now()) {
		ctx.waitUntil(updateVariableList(env, ctx));
	}

	return value;
};

export const getOrUpdateVariableId = async (
	id: string,
	env: Env,
	ctx: ExecutionContext,
) => {
	const { value, metadata } = await env.VARIABLE.getWithMetadata<
		VariableMetadataWithVariants,
		TTLMetadata
	>(id, {
		type: 'json',
	});

	if (!value) {
		return await updateVariable(id, env, ctx);
	}

	if (!metadata?.ttl || metadata.ttl < Date.now()) {
		ctx.waitUntil(updateVariable(id, env, ctx));
	}

	return value;
};

export const getOrUpdateAxisRegistry = async (
	env: Env,
	ctx: ExecutionContext,
) => {
	const { value, metadata } = await env.VARIABLE_LIST.getWithMetadata<
		AxisRegistry,
		TTLMetadata
	>('axis_registry', {
		type: 'json',
	});

	if (!value) {
		return await updateAxisRegistry(env, ctx);
	}

	if (!metadata?.ttl || metadata.ttl < Date.now()) {
		ctx.waitUntil(updateAxisRegistry(env, ctx));
	}

	return value;
};
