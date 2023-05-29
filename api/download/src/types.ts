type CFRouterContext = [env: Env, ctx: ExecutionContext];
interface FileGenerator {
	id: string;
	subsets: string[];
	weights: number[];
	styles: string[];
}

export type { CFRouterContext, FileGenerator };
