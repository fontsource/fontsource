export interface DownloadStats {
	npmDownloadTotal: number;
	npmDownloadMonthly: number;
	jsDelivrHitsTotal: number;
	jsDelivrHitsMonthly: number;
}

export interface StatsResponse {
	total: DownloadStats;
	static: DownloadStats;
	variable?: DownloadStats;
}

const zeroDownloadStats = (): DownloadStats => ({
	npmDownloadMonthly: 0,
	npmDownloadTotal: 0,
	jsDelivrHitsMonthly: 0,
	jsDelivrHitsTotal: 0,
});

export const buildStatsResponse = (
	stats: Partial<StatsResponse> | undefined,
	hasVariable: boolean,
): StatsResponse => ({
	total: stats?.total ?? zeroDownloadStats(),
	static: stats?.static ?? zeroDownloadStats(),
	...(hasVariable ? { variable: stats?.variable ?? zeroDownloadStats() } : {}),
});
