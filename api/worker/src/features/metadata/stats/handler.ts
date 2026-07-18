import type { Context } from 'hono';
import { buildStatsResponse } from '../../../../../shared/stats';
import { CACHE_POLICIES } from '../../../constants';
import type { AppEnv } from '../../../env';
import { notFound } from '../../../utils/errors';
import { getFontById } from '../store';
import { getStats } from './repository';

const badgeConfig = {
	'npm-monthly': {
		field: 'npmDownloadMonthly',
		label: 'downloads',
		suffix: '/month',
		color: 'brightgreen',
	},
	'npm-total': {
		field: 'npmDownloadTotal',
		label: 'downloads',
		suffix: '',
		color: 'brightgreen',
	},
	'jsdelivr-monthly': {
		field: 'jsDelivrHitsMonthly',
		label: 'jsDelivr',
		suffix: '/month',
		color: 'ff5627',
	},
	'jsdelivr-total': {
		field: 'jsDelivrHitsTotal',
		label: 'jsDelivr',
		suffix: '',
		color: 'ff5627',
	},
} as const;

const compactNumber = new Intl.NumberFormat('en', {
	notation: 'compact',
	maximumFractionDigits: 2,
});

/**
 * Lists `/stats`.
 */
export const listStats = async (c: Context<AppEnv>): Promise<Response> =>
	c.json(await getStats(c.env), 200, CACHE_POLICIES.stats);

/**
 * Returns a Shields-compatible aggregate stats badge.
 */
export const getStatsBadge = async (
	c: Context<AppEnv>,
	metric: keyof typeof badgeConfig,
): Promise<Response> => {
	const config = badgeConfig[metric];
	const stats = await getStats(c.env);
	const total = Object.values(stats).reduce(
		(sum, family) => sum + family.total[config.field],
		0,
	);

	return c.json(
		{
			schemaVersion: 1,
			label: config.label,
			message: `${compactNumber.format(total)}${config.suffix}`,
			color: config.color,
		},
		200,
		CACHE_POLICIES.stats,
	);
};

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
