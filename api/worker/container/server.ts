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

const resp500 = (error: unknown): Response =>
	Response.json(
		{
			state: 'failed',
			buildKey: 'unknown',
			error: error instanceof Error ? error.message : String(error),
		},
		{ status: 500 },
	);

const resp500Tagged = (tag: BuildVersionTag, error: unknown): Response => {
	const buildKey = getBuildKey(tag);
	const message = error instanceof Error ? error.message : String(error);

	return Response.json(
		{
			state: 'failed',
			buildKey,
			error: message,
			builtAt: new Date().toISOString(),
		},
		{ status: 500 },
	);
};

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
						return resp500(
							new Error('Invalid request payload. Expected JSON body.'),
						);
					}

					const snapshot = await ensureBuilt(payload);

					return Response.json(snapshot, { status: 200 });
				} catch (error) {
					if (payload) {
						return resp500Tagged(payload.tag, error);
					}

					return resp500(error);
				}
			},
		},
	},
	fetch: () => resp404(),
});
