interface StatsResponse {
	npmDownloadTotal: number;
	npmDownloadMonthly: number;
	jsDelivrHitsTotal: number;
	jsDelivrHitsMonthly: number;
}

interface StatsResponseAll {
	total: StatsResponse;
	static: StatsResponse;
	variable?: StatsResponse;
}

type StatsResponseAllRecord = Record<string, StatsResponseAll>;

export type { StatsResponse, StatsResponseAll, StatsResponseAllRecord };
