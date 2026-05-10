import { HTTPException } from 'hono/http-exception';
import {
	type BuildVersionRequest,
	type BuildVersionTag,
	getBuildKey,
} from '../shared/build';
import { ensureBuilt } from './src/builder';

const PORT = 3000;

const resp404 = (): Response =>
	Response.json(
		{
			status: 404,
			error: 'Not Found.',
		},
		{ status: 404 },
	);

const errorStatus = (error: unknown): number =>
	error instanceof HTTPException ? error.status : 500;

const respError = (error: unknown): Response =>
	Response.json(
		{
			state: 'failed',
			buildKey: 'unknown',
			error: error instanceof Error ? error.message : String(error),
		},
		{ status: errorStatus(error) },
	);

const respErrorTagged = (tag: BuildVersionTag, error: unknown): Response => {
	const buildKey = getBuildKey(tag);
	const message = error instanceof Error ? error.message : String(error);

	return Response.json(
		{
			state: 'failed',
			buildKey,
			error: message,
			builtAt: new Date().toISOString(),
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
					payload = await request.json();
					if (!payload) {
						return respError(
							new Error('Invalid request payload. Expected JSON body.'),
						);
					}

					console.log(
						`[container] POST /build-version ${payload.mode} ${payload.tag.id}@${payload.tag.version}`,
					);

					const snapshot = await ensureBuilt(payload);

					console.log(
						`[container] build complete ${snapshot.buildKey} — ${snapshot.artifactCount} artifacts in ${snapshot.durationMs}ms`,
					);

					return Response.json(snapshot, { status: 200 });
				} catch (error) {
					console.error(
						`[container] build failed`,
						payload
							? `${payload.tag.id}@${payload.tag.version}`
							: '(no payload)',
						error,
					);

					if (payload) {
						return respErrorTagged(payload.tag, error);
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
