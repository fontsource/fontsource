import type {
	BuildVersionRequest,
	BuildVersionResponse,
} from '../../shared/build';
import {
	getBuildKey,
	getBuildRequestKey,
	getFamilyBuildRequestKey,
} from '../../shared/build';
import { buildArtifacts } from './artifacts';

type BuildSnapshot = BuildVersionResponse & {
	builtAt: string;
};

/**
 * Each container is mapped to a specific font/version. Family builds can satisfy
 * file requests, but family requests must not join a narrower file build.
 */
const activeBuilds = new Map<string, Promise<BuildSnapshot>>();

export const ensureBuilt = async (
	request: BuildVersionRequest,
): Promise<BuildSnapshot> => {
	const buildKey = getBuildKey(request.tag);
	const activeFamilyBuild = activeBuilds.get(
		getFamilyBuildRequestKey(request.tag),
	);

	if (request.mode === 'file' && activeFamilyBuild) {
		console.log(`[builder] joined active family build for ${buildKey}`);
		return await activeFamilyBuild;
	}

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
	const buildKey = getBuildKey(request.tag);
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
