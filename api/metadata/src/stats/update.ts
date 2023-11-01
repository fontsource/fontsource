import { type VersionResponse } from 'common-api/types';
import { StatusError } from 'itty-router';

import { getOrUpdateId } from '../fonts/get';
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
		env.STATS.put(key, JSON.stringify(resp), {
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
	const metadata = await getOrUpdateId(id, env, ctx);
	const isVariable = Boolean(metadata?.variable);

	const [
		// Static stats
		npmMonthResp,
		npmTotalResp,
		jsDelivrMonthResp,
		jsDelivrYearResp,
		jsDelivrLastYearResp,

		// Variable stats
		npmMonthRespVariable,
		npmTotalRespVariable,
		jsDelivrMonthRespVariable,
		jsDelivrYearRespVariable,
		jsDelivrLastYearRespVariable,
	] = await Promise.all([
		// Static stats
		// NPM only stores last 18 months of data
		fetch(npmMonth(id, 'static')),
		fetch(npmTotal(id, 'static')),
		fetch(jsDelivrMonth(id, 'static')),
		// We can't query total stats so we'll query last 24 months
		fetch(jsDelivrYear(id, 'static', 'year')),
		fetch(jsDelivrYear(id, 'static', 's-year')),

		// Variable stats
		isVariable ? fetch(npmMonth(id, 'variable')) : undefined,
		isVariable ? fetch(npmTotal(id, 'variable')) : undefined,
		isVariable ? fetch(jsDelivrMonth(id, 'variable')) : undefined,
		isVariable ? fetch(jsDelivrYear(id, 'variable', 'year')) : undefined,
		isVariable ? fetch(jsDelivrYear(id, 'variable', 's-year')) : undefined,
	]);

	if (
		!npmMonthResp.ok ||
		!npmTotalResp.ok ||
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		(npmMonthRespVariable && !npmMonthRespVariable.ok) ||
		(npmTotalRespVariable && !npmTotalRespVariable.ok)
	) {
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
		!jsDelivrLastYearResp.ok ||
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		(jsDelivrMonthRespVariable && !jsDelivrMonthRespVariable.ok) ||
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		(jsDelivrYearRespVariable && !jsDelivrYearRespVariable.ok) ||
		(jsDelivrLastYearRespVariable && !jsDelivrLastYearRespVariable.ok)
	) {
		console.log(await jsDelivrMonthResp.text());
		console.log(await jsDelivrYearResp.text());
		console.log(await jsDelivrLastYearResp.text());
		if (isVariable) {
			console.log(await jsDelivrMonthRespVariable?.text());
			console.log(await jsDelivrYearRespVariable?.text());
			console.log(await jsDelivrLastYearRespVariable?.text());
		}
		throw new StatusError(
			500,
			'Internal Server Error. Unable to fetch download stats from jsDelivr.',
		);
	}

	const [
		// Static stats
		npmMonthData,
		npmTotalData,
		jsDelivrMonthData,
		jsDelivrYearData,
		jsDelivrLastYearData,

		// Variable stats
		npmMonthDataVariable,
		npmTotalDataVariable,
		jsDelivrMonthDataVariable,
		jsDelivrYearDataVariable,
		jsDelivrLastYearDataVariable,
	] = await Promise.all([
		npmMonthResp.json<NPMDownloadRegistry>(),
		npmTotalResp.json<NPMDownloadRegistryRange>(),
		jsDelivrMonthResp.json<JSDelivrStat>(),
		jsDelivrYearResp.json<JSDelivrStat>(),
		jsDelivrLastYearResp.json<JSDelivrStat>(),

		// Variable stats
		isVariable ? npmMonthRespVariable?.json<NPMDownloadRegistry>() : undefined,
		isVariable
			? npmTotalRespVariable?.json<NPMDownloadRegistryRange>()
			: undefined,
		isVariable ? jsDelivrMonthRespVariable?.json<JSDelivrStat>() : undefined,
		isVariable ? jsDelivrYearRespVariable?.json<JSDelivrStat>() : undefined,
		isVariable ? jsDelivrLastYearRespVariable?.json<JSDelivrStat>() : undefined,
	]);

	const npmTotalCountStatic = npmTotalData.downloads.reduce(
		(acc, curr) => acc + curr.downloads,
		0,
	);

	// Variable stat type assertions
	const npmTotalCountVariable = npmTotalDataVariable
		? npmTotalDataVariable.downloads.reduce(
				(acc, curr) => acc + curr.downloads,
				0,
		  )
		: 0;
	const npmTotalMonthVariable = npmMonthDataVariable?.downloads ?? 0;
	const jsDelivrTotalHitsVariable =
		(jsDelivrYearDataVariable?.hits.total ?? 0) +
		(jsDelivrLastYearDataVariable?.hits.total ?? 0);
	const jsDelivrMonthHitsVariable = jsDelivrMonthDataVariable?.hits.total ?? 0;

	const resp: StatsResponseAll = {
		total: {
			npmDownloadTotal: npmTotalCountStatic + npmTotalCountVariable,
			npmDownloadMonthly: npmMonthData.downloads + npmTotalMonthVariable,
			jsDelivrHitsTotal:
				jsDelivrYearData.hits.total +
				jsDelivrLastYearData.hits.total +
				jsDelivrTotalHitsVariable,
			jsDelivrHitsMonthly:
				jsDelivrMonthData.hits.total + jsDelivrMonthHitsVariable,
		},

		static: {
			npmDownloadTotal: npmTotalCountStatic,
			npmDownloadMonthly: npmMonthData.downloads,
			jsDelivrHitsTotal:
				jsDelivrYearData.hits.total + jsDelivrLastYearData.hits.total,
			jsDelivrHitsMonthly: jsDelivrMonthData.hits.total,
		},

		...(isVariable && {
			variable: {
				npmDownloadTotal: npmTotalCountVariable,
				npmDownloadMonthly: npmTotalMonthVariable,
				jsDelivrHitsTotal: jsDelivrTotalHitsVariable,
				jsDelivrHitsMonthly: jsDelivrMonthHitsVariable,
			},
		}),
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
