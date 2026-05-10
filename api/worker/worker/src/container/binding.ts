import { Container } from '@cloudflare/containers';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import type {
	BuildVersionRequest,
	BuildVersionResponse,
} from '../../../shared/build';
import { getBuilderStartupEnv } from '../env';

export const readBuildErrorMessage = async (
	response: Response,
): Promise<string> => {
	const fallback = response.statusText;
	const body = await response.text();

	if (!body) {
		return fallback;
	}

	try {
		const payload = JSON.parse(body) as {
			error?: string;
			message?: string;
		};

		return payload.error ?? payload.message ?? body;
	} catch {
		return body;
	}
};

/**
 * Named container binding used to build one exact font version on demand.
 *
 * Each `getByName(buildKey)` instance maps to one exact build target, which is
 * why the Bun container can keep only a single in-flight build promise.
 */
export class ArtifactBuilder extends Container<Env> {
	defaultPort = 3000;
	sleepAfter = '2m';
	enableInternet = true;

	async buildVersion(
		request: BuildVersionRequest,
	): Promise<BuildVersionResponse> {
		// Pass only the R2 credentials/config that the container needs to upload
		// the built artifacts directly.
		await this.startAndWaitForPorts({
			startOptions: {
				envVars: getBuilderStartupEnv(this.env),
			},
		});

		// Timeout guards against a hung container stalling the worker request.
		try {
			const response = await this.containerFetch(
				`http://localhost:${this.defaultPort}/build-version`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(request),
					signal: AbortSignal.timeout(120_000),
				},
			);

			if (!response.ok) {
				throw new HTTPException(response.status as ContentfulStatusCode, {
					message: await readBuildErrorMessage(response),
				});
			}

			const payload = (await response.json()) as BuildVersionResponse;

			if (payload.state !== 'ready') {
				throw new Error(
					payload.error ?? 'Artifact build did not complete successfully.',
				);
			}

			return payload;
		} finally {
			// Stop the container immediately instead of waiting for the idle timeout,
			// even when the build fails.
			this.stop().catch(() => {});
		}
	}
}
