import type { Context } from 'hono';
import type { AppEnv } from '../../../env';
import { notFound } from '../../../utils/errors';
import { getVariableCatalog } from '../store';

/**
 * Lists the variable metadata index.
 */
export const listVariableFonts = async (
	c: Context<AppEnv>,
): Promise<Response> => c.json(await getVariableCatalog(c), 200);

/**
 * Returns `/variable/:id`.
 */
export const getVariableFont = async (
	c: Context<AppEnv>,
	id: string,
): Promise<Response> => {
	const variableCatalog = await getVariableCatalog(c);
	const item = variableCatalog[id];

	if (!item) {
		throw notFound(`Not Found. Variable metadata for ${id} not found.`);
	}

	return c.json(item, 200);
};
