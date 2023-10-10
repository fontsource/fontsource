import { type VersionResponse } from 'common-api/types';
import { StatusError } from 'itty-router';

import { KV_TTL, STAT_TTL } from '../utils';
import {
	type JSDelivrStat,
	type NPMDownloadRegistry,
	type NPMDownloadRegistryRange,
	type StatsResponseAll,
} from './types';
import { getAvailableVersions } from './util';

export const updateVersion = async (
	id: string,
	isVariable: boolean,
	env: Env,
	ctx: ExecutionContext,
) => {
	const key = `version:${id}`;
	const [staticVal, variable] = await Promise.all([
		getAvailableVersions(id),
		isVariable ? getAvailableVersions(id, isVariable) : undefined,
	]);

	if (!staticVal || staticVal.length === 0) {
		throw new StatusError(404, `Not found. No versions found for ${id}.`);
	}

	const resp: VersionResponse = {
		latest: staticVal[0],
		static: staticVal,
		...(variable && { latestVariable: variable[0], variable }),
	};

	// Add to KV cache
	ctx.waitUntil(
		env.VARIABLE.put(key, JSON.stringify(resp), {
			metadata: {
				ttl: Date.now() / 1000 + KV_TTL,
			},
		}),
	);

	return resp;
};

type StatType = 'static' | 'variable';

const npmMonth = (id: string, type: StatType) =>
	`https://api.npmjs.org/downloads/point/last-month/${
		type === 'variable' ? '@fontsource-variable' : '@fontsource'
	}/${id}`;

const npmTotal = (id: string, type: StatType) =>
	`https://api.npmjs.org/downloads/range/2020-01-01:3000-01-01/${
		type === 'variable' ? '@fontsource-variable' : '@fontsource'
	}/${id}`;

const jsDelivrMonth = (id: string, type: StatType) =>
	`https://data.jsdelivr.com/v1/stats/packages/npm/${
		type === 'variable' ? '@fontsource-variable' : '@fontsource'
	}/${id}?period=month`;

const jsDelivrYear = (id: string, type: StatType, period: string) =>
	`https://data.jsdelivr.com/v1/stats/packages/npm/${
		type === 'variable' ? '@fontsource-variable' : '@fontsource'
	}/${id}?period=${period}`;

export const updatePackageStat = async (
	id: string,
	env: Env,
	ctx: ExecutionContext,
) => {
	const [
		npmMonthResp,
		npmTotalResp,
		jsDelivrMonthResp,
		jsDelivrYearResp,
		jsDelivrLastYearResp,
	] = await Promise.all([
		// NPM only stores last 18 months of data
		fetch(npmMonth(id, 'static')),
		fetch(npmTotal(id, 'static')),
		fetch(jsDelivrMonth(id, 'static')),
		// We can't query total stats so we'll query last 24 months
		fetch(jsDelivrYear(id, 'static', 'year')),
		fetch(jsDelivrYear(id, 'static', 's-year')),
	]);

	if (!npmMonthResp.ok || !npmTotalResp.ok) {
		console.log(await npmMonthResp.text());
		console.log(await npmTotalResp.text());
		throw new StatusError(
			500,
			'Internal Server Error. Unable to fetch download stats from NPM registry.',
		);
	}

	if (
		!jsDelivrMonthResp.ok ||
		!jsDelivrYearResp.ok ||
		!jsDelivrLastYearResp.ok
	) {
		console.log(await jsDelivrMonthResp.text());
		console.log(await jsDelivrYearResp.text());
		console.log(await jsDelivrLastYearResp.text());
		throw new StatusError(
			500,
			'Internal Server Error. Unable to fetch download stats from jsDelivr.',
		);
	}

	const [
		npmMonthData,
		npmTotalData,
		jsDelivrMonthData,
		jsDelivrYearData,
		jsDelivrLastYearData,
	] = await Promise.all([
		npmMonthResp.json<NPMDownloadRegistry>(),
		npmTotalResp.json<NPMDownloadRegistryRange>(),
		jsDelivrMonthResp.json<JSDelivrStat>(),
		jsDelivrYearResp.json<JSDelivrStat>(),
		jsDelivrLastYearResp.json<JSDelivrStat>(),
	]);

	const npmTotalCount = npmTotalData.downloads.reduce(
		(acc, curr) => acc + curr.downloads,
		0,
	);

	const resp: StatsResponseAll = {
		total: {
			npmDownloadTotal: npmTotalCount,
			npmDownloadMonthly: npmMonthData.downloads,
			jsDelivrHitsTotal:
				jsDelivrYearData.hits.total + jsDelivrLastYearData.hits.total,
			jsDelivrHitsMonthly: jsDelivrMonthData.hits.total,
		},

		static: {
			npmDownloadTotal: npmTotalCount,
			npmDownloadMonthly: npmMonthData.downloads,
			jsDelivrHitsTotal:
				jsDelivrYearData.hits.total + jsDelivrLastYearData.hits.total,
			jsDelivrHitsMonthly: jsDelivrMonthData.hits.total,
		},

		// TODO: Add variable stats when jsDelivr resolves the new scope
	};

	// Add to KV cache
	const key = `package:${id}`;
	ctx.waitUntil(
		env.STATS.put(key, JSON.stringify(resp), {
			metadata: {
				ttl: Date.now() / 1000 + STAT_TTL,
			},
		}),
	);

	return resp;
};
