type CFRouterContext = [env: Env, ctx: ExecutionContext];

interface CSSFilename {
	isIndex?: boolean;
	isVariable?: boolean;

	style?: string;
	subset?: string;
	weight?: number;
	axes?: string;
}

export type { CFRouterContext, CSSFilename };
