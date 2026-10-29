import type { Context } from 'hono';

import type { AppEnv } from '../../../env';
import { notFound } from '../../../utils/errors';
import { getVersions } from '../store';

/**
 * Returns `/versions/:id`.
 */
export const getFontVersions = async (
	c: Context<AppEnv>,
	id: string,
): Promise<Response> => {
	const versions = await getVersions(id);
	if (!versions.static.length && !versions.variable?.length)
		throw notFound('Not Found. Font does not exist.');
	return c.json(versions, 200);
};
