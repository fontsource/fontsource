import type { Context } from 'hono';

import type { AppEnv } from '../../../env';
import { notFound } from '../../../utils/errors';
import { getFontById, getVersions } from '../store';

/**
 * Returns `/versions/:id`.
 */
export const getFontVersions = async (
	c: Context<AppEnv>,
	id: string,
): Promise<Response> => {
	const font = await getFontById(c, id);
	if (!font) {
		throw notFound('Not Found. Font does not exist.');
	}

	return c.json(await getVersions(id, Boolean(font.variable)), 200);
};
