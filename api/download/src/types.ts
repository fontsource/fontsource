type CFRouterContext = [env: Env, ctx: ExecutionContext];

interface Manifest {
	id: string;
	subset: string;
	weight: number;
	style: string;
	variable: boolean;
	extension: string;
	version: string;
	url: string;
}

export type { CFRouterContext, Manifest };
