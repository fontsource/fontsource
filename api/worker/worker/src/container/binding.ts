import { Container } from '@cloudflare/containers';

import type {
	BuildVersionFailure,
	BuildVersionRequest,
	BuildVersionResponse,
	BuildVersionResult,
	BuildVersionStatus,
} from '../../../shared/build';
import { getBuildKey, getBuildRequestKey } from '../../../shared/build';
import { getBuilderStartupEnv } from '../env';

const BUILD_TIMEOUT_MS = 10 * 60_000;

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
	private activeBuilds = new Map<string, Promise<BuildVersionResult>>();
	private failedBuilds = new Map<string, BuildVersionFailure>();

	async buildVersion(
		request: BuildVersionRequest,
	): Promise<BuildVersionResult> {
		try {
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
					signal: AbortSignal.timeout(BUILD_TIMEOUT_MS),
				},
			);

			if (!response.ok) {
				return {
					state: 'failed',
					buildKey: getBuildKey(request),
					status: response.status,
					error: await readBuildErrorMessage(response),
				};
			}

			return (await response.json()) as BuildVersionResponse;
		} catch (error) {
			const buildKey = getBuildKey(request);
			const message = error instanceof Error ? error.message : String(error);
			return {
				state: 'failed',
				buildKey,
				status: 502,
				error: `Bad Gateway. Artifact build failed for ${buildKey}: ${message}`,
			};
		}
	}

	async startBuild(request: BuildVersionRequest): Promise<BuildVersionStatus> {
		const requestKey = getBuildRequestKey(request);
		const failed = this.failedBuilds.get(requestKey);

		if (failed) {
			// Report the failure once; a later request can retry the cold build.
			this.failedBuilds.delete(requestKey);
			return failed;
		}

		if (this.activeBuilds.has(requestKey)) {
			return {
				state: 'building',
				buildKey: getBuildKey(request),
			};
		}

		// The pending container I/O keeps the Durable Object active after this RPC
		// returns; the map makes later RPCs join the same logical build.
		const build = this.buildVersion(request).then((result) => {
			this.activeBuilds.delete(requestKey);
			if (result.state === 'failed') {
				this.failedBuilds.set(requestKey, result);
			}
			return result;
		});
		this.activeBuilds.set(requestKey, build);

		return {
			state: 'building',
			buildKey: getBuildKey(request),
		};
	}
}
