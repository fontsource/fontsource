import type { Context } from 'hono';
import { buildStatsResponse } from '../../../../../shared/stats';
import { CACHE_POLICIES } from '../../../constants';
import type { AppEnv } from '../../../env';
import { notFound } from '../../../utils/errors';
import { getFontById } from '../store';
import { getStats } from './repository';

/**
 * Lists `/stats`.
 */
export const listStats = async (c: Context<AppEnv>): Promise<Response> =>
	c.json(await getStats(c.env), 200, CACHE_POLICIES.stats);

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

	const stats = await getStats(c.env, id);
	return c.json(
		buildStatsResponse(stats[id], Boolean(font.variable)),
		200,
		CACHE_POLICIES.stats,
	);
};
