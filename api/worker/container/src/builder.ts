import type {
	BuildVersionRequest,
	BuildVersionResponse,
} from '../../shared/build';
import { getBuildKey, getBuildRequestKey } from '../../shared/build';
import { buildArtifacts } from './artifacts';

type BuildSnapshot = BuildVersionResponse & {
	builtAt: string;
};

const activeBuilds = new Map<string, Promise<BuildSnapshot>>();

export const ensureBuilt = async (
	request: BuildVersionRequest,
): Promise<BuildSnapshot> => {
	const buildKey = getBuildKey(request);
	const requestKey = getBuildRequestKey(request);
	const activeBuild = activeBuilds.get(requestKey);

	if (activeBuild) {
		console.log(
			`[builder] joined active ${request.mode} build for ${buildKey}`,
		);
		return await activeBuild;
	}

	console.log(`[builder] starting ${request.mode} build ${buildKey}`);

	const build = executeBuild(request).finally(() => {
		if (activeBuilds.get(requestKey) === build) {
			activeBuilds.delete(requestKey);
		}
	});

	activeBuilds.set(requestKey, build);
	return await build;
};

const executeBuild = async (
	request: BuildVersionRequest,
): Promise<BuildSnapshot> => {
	const startedAt = Date.now();
	const buildKey = getBuildKey(request);
	const artifactCount = await buildArtifacts(request);
	const durationMs = Date.now() - startedAt;

	console.log(
		`[builder] finished ${request.mode} build ${buildKey} - ${artifactCount} artifacts, ${durationMs}ms`,
	);

	return {
		state: 'ready',
		buildKey,
		mode: request.mode,
		artifactCount,
		durationMs,
		builtAt: new Date().toISOString(),
	};
};
