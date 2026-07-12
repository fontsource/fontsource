import { Container } from '@cloudflare/containers';

import type {
	BuildVersionRequest,
	BuildVersionResponse,
	BuildVersionResult,
} from '../../../shared/build';
import { getBuildKey } from '../../../shared/build';
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
 */
export class ArtifactBuilder extends Container<Env> {
	defaultPort = 3000;
	sleepAfter = '2m';
	enableInternet = true;

	async buildVersion(
		request: BuildVersionRequest,
	): Promise<BuildVersionResult> {
		// Pass only the R2 credentials/config that the container needs to upload
		// the built artifacts directly.
		await this.startAndWaitForPorts({
			startOptions: {
				envVars: getBuilderStartupEnv(this.env),
			},
		});

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
			return {
				state: 'failed',
				buildKey: getBuildKey(request.tag),
				status: response.status,
				error: await readBuildErrorMessage(response),
			};
		}

		return (await response.json()) as BuildVersionResponse;
	}
}
