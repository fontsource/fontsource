import { Container } from '@cloudflare/containers';

import type {
	BuildVersionRequest,
	BuildVersionResponse,
} from '../../../shared/build';
import { getBuilderStartupEnv } from '../env';

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
			let message = response.statusText;

			try {
				const payload = (await response.json()) as {
					error?: string;
					message?: string;
				};
				message = payload.error ?? payload.message ?? message;
			} catch {
				message = (await response.text()) || message;
			}

			throw new Error(message);
		}

		const payload = (await response.json()) as BuildVersionResponse;

		if (payload.state !== 'ready') {
			throw new Error(
				payload.error ?? 'Artifact build did not complete successfully.',
			);
		}

		return payload;
	}
}
