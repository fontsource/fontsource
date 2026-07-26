import { describe, expect, it } from 'vitest';
import { processWithConcurrency } from './processWithConcurrency';

describe('processWithConcurrency', () => {
	it('limits active tasks and preserves result order', async () => {
		let active = 0;
		let peakActive = 0;

		const result = await processWithConcurrency(
			[20, 10, 0],
			async (delay) => {
				active++;
				peakActive = Math.max(peakActive, active);
				await new Promise((resolve) => setTimeout(resolve, delay));
				active--;
				return delay * 2;
			},
			undefined,
			2,
		);

		expect(result).toEqual({
			results: [40, 20, 0],
			processedCount: 3,
			stopped: false,
		});
		expect(peakActive).toBe(2);
	});

	it('finishes active tasks without starting more after cancellation', async () => {
		let stopped = false;
		let releaseActiveTasks!: () => void;
		let reportActiveTasks!: () => void;
		const activeTasks = new Promise<void>((resolve) => {
			reportActiveTasks = resolve;
		});
		const release = new Promise<void>((resolve) => {
			releaseActiveTasks = resolve;
		});
		const started: number[] = [];

		const processing = processWithConcurrency(
			[1, 2, 3, 4],
			async (value) => {
				started.push(value);
				if (started.length === 2) reportActiveTasks();
				await release;
				return value;
			},
			() => stopped,
			2,
		);

		await activeTasks;
		stopped = true;
		releaseActiveTasks();
		const result = await processing;

		expect(started).toEqual([1, 2]);
		expect(result).toEqual({
			results: [1, 2],
			processedCount: 2,
			stopped: true,
		});
	});
});
