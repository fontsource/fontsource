declare module 'cloudflare:test' {
	export function applyD1Migrations(
		db: D1Database,
		migrations: D1Migration[],
	): Promise<void>;
	export function createExecutionContext(): ExecutionContext;
	export function waitOnExecutionContext(ctx: ExecutionContext): Promise<void>;
	export function createMessageBatch<Body = unknown>(
		queueName: string,
		messages: ServiceBindingQueueMessage<Body>[],
	): MessageBatch<Body>;
	export function getQueueResult(
		batch: MessageBatch,
		ctx: ExecutionContext,
	): Promise<FetcherQueueResult>;
	export function createScheduledController(
		options?: FetcherScheduledOptions,
	): ScheduledController;
}
