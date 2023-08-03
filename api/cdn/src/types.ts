type CFRouterContext = [env: Env, ctx: ExecutionContext];

type Tag = Record<string, string>;

interface Version {
	version: string;
	links: {
		self: string;
		entry: string;
		stats: string;
	};
}

interface JSDelivrAPIVersion {
	type: string;
	name: string;
	tags: Tag[];
	versions: Version[];
	links: {
		stats: string;
	};
}

export type { CFRouterContext, JSDelivrAPIVersion };
