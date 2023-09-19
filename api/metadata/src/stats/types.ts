interface NPMDownloadRegistry {
	downloads: number;
	start: string;
	end: string;
	package: string;
}

interface JSDelivrStatItem {
	rank: number;
	typeRank: number;
	total: number;
	dates: Record<string, number>;
}

interface JSDelivrStat {
	hits: JSDelivrStatItem;
	bandwidth: JSDelivrStatItem;
}

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

export type {
	JSDelivrStat,
	NPMDownloadRegistry,
	StatsResponse,
	StatsResponseAll,
};
