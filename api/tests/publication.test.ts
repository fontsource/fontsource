import { beforeEach, expect, it } from 'vitest';
import { KV_KEYS, UPSTREAM_URLS } from '../worker/src/constants';
import { refreshPublishedPackages } from '../worker/src/features/metadata/refresh';
import {
	packageManifest,
	packageMetadata,
	publishedPackages,
} from './fixtures/publication';
import { dispatch, jsonSnapshot, setupWorkerTest, testEnv } from './helpers';
import { mockUpstreamResponses } from './network';

beforeEach(setupWorkerTest);

it('serves promoted versions and exact outputs independently of catalog membership', async () => {
	mockUpstreamResponses({
		[`${UPSTREAM_URLS.jsdelivrNpm}/@fontsource/new-math@6.0.0/manifest.json`]:
			Response.json(packageManifest),
		[`${UPSTREAM_URLS.jsdelivrNpm}/@fontsource/new-math@6.0.0/metadata.json`]:
			Response.json(packageMetadata),
	});
	const output = await jsonSnapshot(
		'https://fontsource.test/v1/packages/new-math/static/6.0.0',
	);
	expect({
		packages: await jsonSnapshot('https://fontsource.test/v1/packages'),
		output,
	}).toMatchSnapshot();
});

it('keeps the previous publication index when the replacement is invalid', async () => {
	mockUpstreamResponses({
		[UPSTREAM_URLS.publishedPackages]: Response.json({
			broken: { static: 'latest' },
		}),
	});
	await expect(refreshPublishedPackages(testEnv)).rejects.toThrow();
	expect(await testEnv.METADATA.get(KV_KEYS.publishedPackages, 'json')).toEqual(
		publishedPackages,
	);
});

it.each([
	{ id: 'different' },
	{ family: 'Different' },
	{ sourceModified: '2025-01-01' },
])('rejects inconsistent package metadata %j', async (mismatch) => {
	mockUpstreamResponses({
		[`${UPSTREAM_URLS.jsdelivrNpm}/@fontsource/new-math@6.0.0/manifest.json`]:
			Response.json(packageManifest),
		[`${UPSTREAM_URLS.jsdelivrNpm}/@fontsource/new-math@6.0.0/metadata.json`]:
			Response.json({ ...packageMetadata, ...mismatch }),
	});
	const { response, settle } = await dispatch(
		'https://fontsource.test/v1/packages/new-math/static/6.0.0',
	);
	expect(response.status).toBe(502);
	await response.text();
	await settle();
});
