interface YieldScheduler {
	yield?: () => Promise<void>;
}

const MAX_PROCESSING_CONCURRENCY = 4;

const yieldToMainThread = async () => {
	const scheduler = (
		globalThis as typeof globalThis & { scheduler?: YieldScheduler }
	).scheduler;

	if (scheduler?.yield) {
		await scheduler.yield();
		return;
	}

	await new Promise<void>((resolve) => setTimeout(resolve, 0));
};

const processingConcurrency = () => {
	const available =
		typeof navigator === 'undefined' ? 2 : navigator.hardwareConcurrency || 2;
	return Math.max(1, Math.min(MAX_PROCESSING_CONCURRENCY, available));
};

export const processWithConcurrency = async <Input, Output>(
	items: readonly Input[],
	process: (item: Input, index: number) => Promise<Output>,
	shouldStop: () => boolean = () => false,
	concurrency = processingConcurrency(),
) => {
	const results: Array<{ value: Output } | undefined> = [];
	let processedCount = 0;
	let failure: { error: unknown } | undefined;
	const entries = items.entries();

	const worker = async () => {
		while (!failure && !shouldStop()) {
			const next = entries.next();
			if (next.done) return;
			const [index, item] = next.value;

			try {
				results[index] = { value: await process(item, index) };
			} catch (error) {
				failure ??= { error };
				return;
			}
			processedCount++;
			await yieldToMainThread();
		}
	};

	await Promise.all(
		Array.from(
			{ length: Math.min(items.length, Math.max(1, Math.floor(concurrency))) },
			worker,
		),
	);

	if (failure) throw failure.error;

	return {
		results: results.flatMap((result) => (result ? [result.value] : [])),
		processedCount,
		stopped: processedCount < items.length,
	};
};
