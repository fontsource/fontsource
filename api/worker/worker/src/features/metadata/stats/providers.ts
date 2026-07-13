import { UPSTREAM_URLS } from '../../../constants';

const NPM_STATS_START_DAY = '2015-01-10';
const NPM_PACE_MS = 500;
const NPM_RETRY_DELAYS_MS = [5_000, 10_000, 20_000, 40_000, 80_000];
// Keep sustained jsDelivr traffic below its 100 RPM coordination threshold.
const JSDELIVR_PACE_MS = 650;

export const NPM_STATS_START_YEAR = 2015;
export const JSDELIVR_STATS_START_YEAR = 2020;

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null;

const addDays = (day: string, amount: number): string => {
	const date = new Date(`${day}T00:00:00.000Z`);
	date.setUTCDate(date.getUTCDate() + amount);
	return date.toISOString().slice(0, 10);
};

const inclusiveDayCount = (from: string, to: string): number =>
	Math.floor(
		(new Date(`${to}T00:00:00.000Z`).getTime() -
			new Date(`${from}T00:00:00.000Z`).getTime()) /
			(24 * 60 * 60 * 1000),
	) + 1;

const packagePath = (packageName: string): string =>
	encodeURIComponent(packageName);

const retryAfterMs = (value: string | null): number | null => {
	if (value === null) return null;

	const seconds = Number(value);
	if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;

	const retryAt = Date.parse(value);
	return Number.isFinite(retryAt) ? Math.max(0, retryAt - Date.now()) : null;
};

const fetchJson = async (
	url: string,
	options: {
		allowNotFound?: boolean;
		paceMs?: number;
		retry429?: boolean;
	} = {},
): Promise<unknown | null> => {
	for (let attempt = 0; ; attempt += 1) {
		const response = await fetch(url, {
			headers: {
				Accept: 'application/json',
				'User-Agent': 'Fontsource-Stats',
			},
		}).finally(() =>
			options.paceMs ? scheduler.wait(options.paceMs) : undefined,
		);

		if (options.allowNotFound && response.status === 404) return null;
		if (response.ok) return response.json();

		const retryDelay = NPM_RETRY_DELAYS_MS[attempt];
		if (
			!options.retry429 ||
			response.status !== 429 ||
			retryDelay === undefined
		) {
			throw new Error(`Stats upstream ${response.status}: ${url}`);
		}

		const delayMs =
			retryAfterMs(response.headers.get('Retry-After')) ?? retryDelay;
		console.warn({
			event: 'stats_upstream_retry',
			provider: 'npm',
			status: response.status,
			attempt: attempt + 1,
			delayMs,
			url,
		});
		await scheduler.wait(delayMs);
	}
};

export const fetchPackageCreatedDay = async (
	packageName: string,
	isLegacy: boolean,
): Promise<string | null> => {
	const payload = await fetchJson(
		`${UPSTREAM_URLS.npmRegistry}/${packagePath(packageName)}`,
		{ allowNotFound: isLegacy },
	);
	if (payload === null) return null;

	const created = isRecord(payload) ? payload.time : undefined;
	const createdValue = isRecord(created) ? created.created : undefined;
	const createdDay =
		typeof createdValue === 'string' ? createdValue.slice(0, 10) : '';
	return /^\d{4}-\d{2}-\d{2}$/.test(createdDay) &&
		Number.isFinite(new Date(`${createdDay}T00:00:00.000Z`).getTime())
		? createdDay
		: NPM_STATS_START_DAY;
};

const fetchNpmRange = async (
	packageName: string,
	from: string,
	to: string,
): Promise<number> => {
	const payload = await fetchJson(
		`${UPSTREAM_URLS.npmDownloads}/${from}:${to}/${packagePath(packageName)}`,
		{
			allowNotFound: true,
			paceMs: NPM_PACE_MS,
			retry429: true,
		},
	);
	if (payload === null) return 0;

	const values = isRecord(payload) ? payload.downloads : undefined;
	if (!Array.isArray(values)) {
		throw new Error(`Invalid npm stats response for ${packageName}`);
	}

	const downloads = values.filter(
		(value): value is { day: string; downloads: number } =>
			isRecord(value) &&
			typeof value.day === 'string' &&
			typeof value.downloads === 'number',
	);
	if (
		downloads.length !== inclusiveDayCount(from, to) ||
		downloads[0]?.day !== from ||
		downloads.at(-1)?.day !== to
	) {
		throw new Error(
			`Incomplete npm stats range for ${packageName}: ${from}:${to}`,
		);
	}

	return downloads.reduce((total, item) => total + item.downloads, 0);
};

export const fetchNpmDownloads = (
	packageName: string,
	period: 'month' | number,
	createdDay: string,
	today: string,
): Promise<number> => {
	const periodStart =
		period === 'month' ? addDays(today, -29) : `${period}-01-01`;
	const from = [periodStart, createdDay, NPM_STATS_START_DAY].sort().at(-1);
	const to =
		typeof period === 'number' && period !== Number(today.slice(0, 4))
			? `${period}-12-31`
			: today;
	return fetchNpmRange(packageName, from ?? today, to);
};

export const fetchJsDelivrDownloads = async (
	packageName: string,
	period: 'month' | number,
): Promise<number> => {
	const isCurrentYear =
		typeof period === 'number' && period === new Date().getUTCFullYear();
	const queryPeriod = isCurrentYear ? 'year' : period;
	const payload = await fetchJson(
		`${UPSTREAM_URLS.jsdelivrStats}/${packagePath(packageName)}?period=${queryPeriod}`,
		{ allowNotFound: true },
	).finally(() => scheduler.wait(JSDELIVR_PACE_MS));
	if (payload === null) return 0;

	const hits = isRecord(payload) ? payload.hits : undefined;
	if (isCurrentYear) {
		const dates = isRecord(hits) ? hits.dates : undefined;
		if (!isRecord(dates)) {
			throw new Error(`Invalid jsDelivr stats response for ${packageName}`);
		}

		let total = 0;
		for (const [day, downloads] of Object.entries(dates)) {
			if (!day.startsWith(`${period}-`)) continue;
			if (typeof downloads !== 'number' || downloads < 0) {
				throw new Error(`Invalid jsDelivr stats response for ${packageName}`);
			}
			total += downloads;
		}
		return total;
	}

	const total = isRecord(hits) ? hits.total : undefined;
	if (typeof total !== 'number' || total < 0) {
		throw new Error(`Invalid jsDelivr stats response for ${packageName}`);
	}

	return total;
};
