import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { type BuildVersionRequest, getBuildKey } from '../shared/build';
import { logger } from '../shared/logger';
import { UpstreamNotFoundError } from '../shared/upstream';

const PORT = 3000;

type ArtifactBuilder = (request: BuildVersionRequest) => Promise<number>;

const defaultArtifactBuilder: ArtifactBuilder = async (request) => {
	const { buildArtifacts } = await import('./src/artifacts');
	return buildArtifacts(request);
};

const errorStatus = (error: unknown): ContentfulStatusCode =>
	error instanceof HTTPException
		? error.status
		: error instanceof UpstreamNotFoundError
			? 404
			: 500;

export const createContainerApp = (
	buildArtifacts: ArtifactBuilder = defaultArtifactBuilder,
) => {
	const app = new Hono();
	let buildStarted = false;

	app.get('/health', (c) => c.json({ status: 200 }));

	app.post('/build-version', async (c) => {
		let payload: BuildVersionRequest | undefined;

		try {
			if (buildStarted) {
				throw new HTTPException(409, {
					message: 'This container instance already accepted a build.',
				});
			}
			buildStarted = true;

			payload = await c.req.json<BuildVersionRequest>();
			if (!payload) {
				throw new Error('Invalid request payload. Expected JSON body.');
			}

			const buildKey = getBuildKey(payload);
			const startedAt = Date.now();
			logger.info(
				{ mode: payload.mode, buildKey },
				'[container] starting build',
			);
			const artifactCount = await buildArtifacts(payload);
			const durationMs = Date.now() - startedAt;

			logger.info(
				{ mode: payload.mode, buildKey, artifactCount, durationMs },
				'[container] finished build',
			);

			return c.json({ state: 'ready', buildKey });
		} catch (error) {
			logger.error(
				{ err: error, buildKey: payload ? getBuildKey(payload) : undefined },
				'[container] build failed',
			);

			return c.json(
				{
					state: 'failed',
					buildKey: payload ? getBuildKey(payload) : 'unknown',
					error: error instanceof Error ? error.message : String(error),
				},
				errorStatus(error),
			);
		}
	});

	app.notFound((c) => {
		const url = new URL(c.req.url);
		logger.warn(
			{ method: c.req.method, pathname: url.pathname },
			'[container] unmatched request',
		);
		return c.json({ status: 404, error: 'Not Found.' }, 404);
	});

	return app;
};

if (import.meta.main) {
	serve({ fetch: createContainerApp().fetch, port: PORT }, () => {
		logger.info({ port: PORT }, '[container] listening');
	});
}
