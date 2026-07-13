import { HTTPException } from 'hono/http-exception';
import { type BuildVersionRequest, getBuildKey } from '../shared/build';
import { UpstreamNotFoundError } from '../shared/upstream';
import { buildArtifacts } from './src/artifacts';

const PORT = 3000;
let buildStarted = false;

const resp404 = (): Response =>
	Response.json(
		{
			status: 404,
			error: 'Not Found.',
		},
		{ status: 404 },
	);

const errorStatus = (error: unknown): number =>
	error instanceof HTTPException
		? error.status
		: error instanceof UpstreamNotFoundError
			? 404
			: 500;

const respError = (error: unknown, request?: BuildVersionRequest): Response => {
	const message = error instanceof Error ? error.message : String(error);

	return Response.json(
		{
			state: 'failed',
			buildKey: request ? getBuildKey(request) : 'unknown',
			error: message,
		},
		{ status: errorStatus(error) },
	);
};

console.log(`[container] listening on port ${PORT}`);

Bun.serve({
	port: PORT,
	routes: {
		'/health': () => Response.json({ status: 200 }, { status: 200 }),
		'/build-version': {
			POST: async (request: Request) => {
				let payload: BuildVersionRequest | undefined;

				try {
					if (buildStarted) {
						throw new HTTPException(409, {
							message: 'This container instance already accepted a build.',
						});
					}
					buildStarted = true;

					payload = await request.json();
					if (!payload) {
						return respError(
							new Error('Invalid request payload. Expected JSON body.'),
						);
					}

					const buildKey = getBuildKey(payload);
					const startedAt = Date.now();
					console.log(`[container] starting ${payload.mode} build ${buildKey}`);
					const artifactCount = await buildArtifacts(payload);
					const durationMs = Date.now() - startedAt;

					console.log(
						`[container] finished ${payload.mode} build ${buildKey} - ${artifactCount} artifacts in ${durationMs}ms`,
					);

					return Response.json({ state: 'ready', buildKey }, { status: 200 });
				} catch (error) {
					console.error(
						`[container] build failed`,
						payload ? getBuildKey(payload) : '(no payload)',
						error,
					);

					if (payload) {
						return respError(error, payload);
					}

					return respError(error);
				}
			},
		},
	},
	fetch: (request) => {
		console.warn(
			`[container] unmatched request ${request.method} ${new URL(request.url).pathname}`,
		);
		return resp404();
	},
});
