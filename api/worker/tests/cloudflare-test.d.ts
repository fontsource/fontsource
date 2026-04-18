declare module 'cloudflare:test' {
	export function createExecutionContext(): ExecutionContext;
	export function waitOnExecutionContext(ctx: ExecutionContext): Promise<void>;
	export function createScheduledController(
		options?: FetcherScheduledOptions,
	): ScheduledController;
}
