import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';
import { deferred } from '@/test/deferred';
import { createFontSetArchive } from './downloadFontSet';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
	server.resetHandlers();
	vi.useRealTimers();
});
afterAll(() => server.close());

it('waits for Retry-After before downloading and assembling a prepared archive', async () => {
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
	const accepted = deferred();
	const archive = zipSync({ 'font.woff2': strToU8('font data') });
	let attempts = 0;
	server.use(
		http.get('https://api.fontsource.org/v1/download/inter', () => {
			if (++attempts === 1) {
				accepted.resolve();
				return new HttpResponse(null, {
					status: 202,
					headers: { 'Retry-After': '2' },
				});
			}
			return HttpResponse.arrayBuffer(archive.buffer as ArrayBuffer);
		}),
	);
	const result = createFontSetArchive([{ familyId: 'inter' }], () => {});
	await accepted.promise;
	await vi.advanceTimersByTimeAsync(0);
	await vi.advanceTimersByTimeAsync(1999);
	expect(attempts).toBe(1);
	await vi.advanceTimersByTimeAsync(1);
	const files = unzipSync(new Uint8Array(await (await result).arrayBuffer()));
	expect(Object.keys(files)).toEqual(['inter/font.woff2']);
	expect(strFromU8(files['inter/font.woff2'])).toBe('font data');
});

it('cancels preparation during Retry-After without fetching another archive', async () => {
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
	const accepted = deferred();
	let attempts = 0;
	server.use(
		http.get('https://api.fontsource.org/v1/download/inter', () => {
			attempts += 1;
			accepted.resolve();
			return new HttpResponse(null, {
				status: 202,
				headers: { 'Retry-After': '5' },
			});
		}),
	);
	const controller = new AbortController();
	const result = createFontSetArchive([{ familyId: 'inter' }], () => {}, {
		signal: controller.signal,
	});
	const rejection = expect(result).rejects.toMatchObject({
		name: 'AbortError',
	});
	await accepted.promise;
	await vi.advanceTimersByTimeAsync(0);
	expect(vi.getTimerCount()).toBe(1);
	controller.abort();
	await rejection;
	await vi.advanceTimersByTimeAsync(5000);
	expect(attempts).toBe(1);
});
