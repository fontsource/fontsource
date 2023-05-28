type CFRouterContext = [env: Env, ctx: ExecutionContext];

interface FontVariants {
	[weight: string]: {
		[style: string]: {
			[subset: string]: {
				url: {
					woff2: string;
					woff: string;
					ttf?: string;
					otf?: string;
				};
			};
		};
	};
}
interface IDResponse {
	id: string;
	family: string;
	subsets: string[];
	weights: number[];
	styles: string[];
	defSubset: string;
	variable: boolean;
	lastModified: string;
	category: string;
	license: string;
	type: string;
	unicodeRange: Record<string, string>;
	variants: FontVariants;
}

export type { CFRouterContext, IDResponse };
