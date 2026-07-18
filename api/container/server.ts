import {
	createServer,
	type IncomingMessage,
	type ServerResponse,
} from 'node:http';
import { pathToFileURL } from 'node:url';
import { HTTPException } from 'hono/http-exception';
import { type BuildVersionRequest, getBuildKey } from '../shared/build';
import { UpstreamNotFoundError } from '../shared/upstream';

const PORT = 3000;

type ArtifactBuilder = (request: BuildVersionRequest) => Promise<number>;

const defaultArtifactBuilder: ArtifactBuilder = async (request) => {
	const { buildArtifacts } = await import('./src/artifacts');
	return buildArtifacts(request);
};

const sendJson = (
	response: ServerResponse,
	body: unknown,
	status = 200,
): void => {
	response.writeHead(status, { 'content-type': 'application/json' });
	response.end(JSON.stringify(body));
};

const errorStatus = (error: unknown): number =>
	error instanceof HTTPException
		? error.status
		: error instanceof UpstreamNotFoundError
			? 404
			: 500;

const sendError = (
	response: ServerResponse,
	error: unknown,
	request?: BuildVersionRequest,
): void => {
	const message = error instanceof Error ? error.message : String(error);

	sendJson(
		response,
		{
			state: 'failed',
			buildKey: request ? getBuildKey(request) : 'unknown',
			error: message,
		},
		errorStatus(error),
	);
};

const readJson = async (request: IncomingMessage): Promise<unknown> => {
	const chunks: Buffer[] = [];
	for await (const chunk of request) {
		chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
	}

	return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};

export const createContainerServer = (
	buildArtifacts: ArtifactBuilder = defaultArtifactBuilder,
) => {
	let buildStarted = false;

	return createServer(async (request, response) => {
		if (request.method === 'GET' && request.url === '/health') {
			sendJson(response, { status: 200 });
			return;
		}

		if (request.method === 'POST' && request.url === '/build-version') {
			let payload: BuildVersionRequest | undefined;

			try {
				if (buildStarted) {
					throw new HTTPException(409, {
						message: 'This container instance already accepted a build.',
					});
				}
				buildStarted = true;

				payload = (await readJson(request)) as BuildVersionRequest;
				if (!payload) {
					sendError(
						response,
						new Error('Invalid request payload. Expected JSON body.'),
					);
					return;
				}

				const buildKey = getBuildKey(payload);
				const startedAt = Date.now();
				console.log(`[container] starting ${payload.mode} build ${buildKey}`);
				const artifactCount = await buildArtifacts(payload);
				const durationMs = Date.now() - startedAt;

				console.log(
					`[container] finished ${payload.mode} build ${buildKey} - ${artifactCount} artifacts in ${durationMs}ms`,
				);

				sendJson(response, { state: 'ready', buildKey });
			} catch (error) {
				console.error(
					'[container] build failed',
					payload ? getBuildKey(payload) : '(no payload)',
					error,
				);

				sendError(response, error, payload);
			}
			return;
		}

		console.warn(
			`[container] unmatched request ${request.method} ${request.url}`,
		);
		sendJson(response, { status: 404, error: 'Not Found.' }, 404);
	});
};

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(process.argv[1]).href
) {
	createContainerServer().listen(PORT, () => {
		console.log(`[container] listening on port ${PORT}`);
	});
}
