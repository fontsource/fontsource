import './network';
import {
	applyD1Migrations,
	createExecutionContext,
	reset,
	waitOnExecutionContext,
} from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { afterEach, vi } from 'vitest';

import {
	type BuildVersionRequest,
	type BuildVersionResult,
	type BuildVersionStatus,
	getBuildKey,
} from '../shared/build';
import { KV_KEYS } from '../worker/src/constants';
import { clearMetadataCachesForTest } from '../worker/src/features/metadata/store';
import worker from '../worker/src/index';
import { testAxisRegistry, testCatalog } from './fixtures/metadata';

export const testEnv = env as unknown as Env;
const artifactBuilder = testEnv.ARTIFACT_BUILDER;
afterEach(() => {
	testEnv.ARTIFACT_BUILDER = artifactBuilder;
});

export const dispatch = async (
	input: string | Request,
): Promise<{ response: Response; settle: () => Promise<void> }> => {
	const request = typeof input === 'string' ? new Request(input) : input;
	const ctx = createExecutionContext();
	const response = await worker.fetch(request, testEnv, ctx);

	return {
		response,
		settle: async () => {
			await waitOnExecutionContext(ctx);
		},
	};
};

export const jsonSnapshot = async (input: string | Request) => {
	const { response, settle } = await dispatch(input);
	const body = await response.json();
	await settle();
	return { status: response.status, headers: serializeHeaders(response), body };
};

export const textSnapshot = async (input: string | Request) => {
	const { response, settle } = await dispatch(input);
	const body = await response.text();
	await settle();
	return { status: response.status, headers: serializeHeaders(response), body };
};

export const setupWorkerTest = async (): Promise<void> => {
	await reset();
	clearMetadataCachesForTest();
	installArtifactBuilderMock(testEnv);
	await applyD1Migrations(
		testEnv.STATS,
		(
			testEnv as Env & {
				TEST_MIGRATIONS: Parameters<typeof applyD1Migrations>[1];
			}
		).TEST_MIGRATIONS,
	);
	await seedMetadata(testEnv);
};

const serializeHeaders = (response: Response): Record<string, string> => {
	const result: Record<string, string> = {};
	const cacheControl = response.headers.get('Cache-Control');
	const cdnCacheControl = response.headers.get('CDN-Cache-Control');
	const edgeCacheControl = response.headers.get('Cloudflare-CDN-Cache-Control');
	const contentDisposition = response.headers.get('Content-Disposition');
	const contentType = response.headers.get('Content-Type');
	const etag = response.headers.get('ETag');
	const location = response.headers.get('Location');
	const lastModified = response.headers.get('Last-Modified');

	if (cacheControl) result.cacheControl = cacheControl;
	if (cdnCacheControl) result.cdnCacheControl = cdnCacheControl;
	if (edgeCacheControl) result.edgeCacheControl = edgeCacheControl;
	if (contentDisposition) result.contentDisposition = contentDisposition;
	if (contentType) result.contentType = contentType;
	if (etag) result.etag = '<etag>';
	if (location) result.location = location;
	if (lastModified) result.lastModified = '<last-modified>';

	return result;
};

const seedMetadata = async (env: Env): Promise<void> => {
	await env.METADATA.put(KV_KEYS.catalog, JSON.stringify(testCatalog));
	await env.METADATA.put(
		KV_KEYS.axisRegistry,
		JSON.stringify(testAxisRegistry),
	);
};

export const seedStats = async (env: Env): Promise<void> => {
	await env.STATS.batch([
		env.STATS.prepare(
			`INSERT INTO stats_packages
				(package_name, family_id, kind, active, npm_monthly, jsdelivr_monthly)
			VALUES
				('@fontsource/abel', 'abel', 'static', 1, 7, 15),
				('fontsource-abel', 'abel', 'legacy', 1, 3, 5),
				('fontsource-abel-inactive', 'abel', 'legacy', 0, 1000, 1000),
				('@fontsource/recursive', 'recursive', 'static', 1, 5, 10),
				('@fontsource-variable/recursive', 'recursive', 'variable', 1, 10, 15)`,
		),
		env.STATS.prepare(
			`INSERT INTO stats_periods (package_name, provider, year, total)
			VALUES
				('@fontsource/abel', 'npm', 2026, 70),
				('@fontsource/abel', 'jsdelivr', 2026, 150),
				('fontsource-abel', 'npm', 2026, 30),
				('fontsource-abel', 'jsdelivr', 2026, 50),
				('fontsource-abel-inactive', 'npm', 2026, 1000),
				('fontsource-abel-inactive', 'jsdelivr', 2026, 1000),
				('@fontsource/recursive', 'npm', 2026, 50),
				('@fontsource/recursive', 'jsdelivr', 2026, 100),
				('@fontsource-variable/recursive', 'npm', 2026, 100),
				('@fontsource-variable/recursive', 'jsdelivr', 2026, 150)`,
		),
	]);
};

export const installArtifactBuilderMock = (env: Env) => {
	const buildVersion = vi.fn(
		async (request: BuildVersionRequest): Promise<BuildVersionResult> => ({
			state: 'ready',
			buildKey: getBuildKey(request),
		}),
	);
	const startBuild = vi.fn(
		async (request: BuildVersionRequest): Promise<BuildVersionStatus> => ({
			state: 'building',
			buildKey: getBuildKey(request),
		}),
	);
	env.ARTIFACT_BUILDER = {
		getByName: () => ({ buildVersion, startBuild }),
	} as unknown as Env['ARTIFACT_BUILDER'];
	return { buildVersion, startBuild };
};
