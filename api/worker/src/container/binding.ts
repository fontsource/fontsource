import { Container, type StopParams } from '@cloudflare/containers';

import type {
	BuildVersionFailure,
	BuildVersionRequest,
	BuildVersionResponse,
	BuildVersionResult,
	BuildVersionStatus,
} from '../../../shared/build';
import { getBuildKey } from '../../../shared/build';
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
	sleepAfter = '1s';
	enableInternet = true;
	// The binding name is the build key, so each Durable Object owns one job.
	private activeBuild?: Promise<BuildVersionResult>;
	private failedBuild?: BuildVersionFailure;

	override onStop({ exitCode, reason }: StopParams): void {
		console.log('[container] stopped', { exitCode, reason });
	}

	override async onActivityExpired(): Promise<void> {
		if (!this.activeBuild) {
			await this.destroy();
		}
	}

	private async executeBuild(
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
		} finally {
			// The one-shot image has no cleanup left after its response is consumed.
			// destroy() avoids waiting through the SIGTERM grace period used by stop().
			try {
				await this.destroy();
			} catch (error) {
				console.error(
					'[container] failed to destroy completed instance',
					error,
				);
			}
		}
	}

	private getOrStartBuild(
		request: BuildVersionRequest,
	): Promise<BuildVersionResult> {
		if (this.activeBuild) {
			return this.activeBuild;
		}

		const build = this.executeBuild(request).finally(() => {
			if (this.activeBuild === build) {
				this.activeBuild = undefined;
			}
		});
		this.activeBuild = build;
		return build;
	}

	async buildVersion(
		request: BuildVersionRequest,
	): Promise<BuildVersionResult> {
		return await this.getOrStartBuild(request);
	}

	async startBuild(request: BuildVersionRequest): Promise<BuildVersionStatus> {
		if (this.failedBuild) {
			// Report the failure once; a later request can retry the cold build.
			const failure = this.failedBuild;
			this.failedBuild = undefined;
			return failure;
		}

		const buildKey = getBuildKey(request);
		if (this.activeBuild) {
			return {
				state: 'building',
				buildKey,
			};
		}

		const build = this.getOrStartBuild(request).then((result) => {
			if (result.state === 'failed') {
				this.failedBuild = result;
			}
			return result;
		});
		this.ctx.waitUntil(build);

		return {
			state: 'building',
			buildKey,
		};
	}
}
