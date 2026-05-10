import type { Context } from 'hono';
import { buildStatsResponse } from '../../../../../shared/stats';
import type { AppEnv } from '../../../env';
import { notFound } from '../../../utils/errors';
import { getFontById, getStats } from '../store';

/**
 * Lists `/stats`.
 */
export const listStats = async (c: Context<AppEnv>): Promise<Response> =>
	c.json(await getStats(c), 200);

/**
 * Returns `/stats/:id`.
 */
export const getFontStats = async (
	c: Context<AppEnv>,
	id: string,
): Promise<Response> => {
	const font = await getFontById(c, id);
	if (!font) {
		throw notFound('Not Found. Font does not exist.');
	}

	const stats = await getStats(c);
	return c.json(buildStatsResponse(stats[id], Boolean(font.variable)), 200);
};
