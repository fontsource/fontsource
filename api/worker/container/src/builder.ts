import type {
	BuildVersionRequest,
	BuildVersionResponse,
} from '../../shared/build';
import { getBuildKey } from '../../shared/build';
import { buildArtifacts } from './artifacts';

type BuildSnapshot = BuildVersionResponse & {
	builtAt: string;
};

/**
 * Each container is mapped to a specific build key (a unique font and version),
 * so a single in-flight build promise is enough to dedupe concurrent requests.
 */
let buildFlight: Promise<BuildSnapshot> | undefined;

export const ensureBuilt = async (
	request: BuildVersionRequest,
): Promise<BuildSnapshot> => {
	if (buildFlight) {
		return await buildFlight;
	}

	// No existing build in-flight. Start a new one and share the promise for
	// concurrent requests until it settles.
	const flight = executeBuild(request).finally(() => {
		if (buildFlight === flight) {
			// Clear the shared slot once this build settles so a later cold miss can
			// start a fresh build instead of reusing a completed promise.
			buildFlight = undefined;
		}
	});

	buildFlight = flight;
	return await flight;
};

const executeBuild = async (
	request: BuildVersionRequest,
): Promise<BuildSnapshot> => {
	const startedAt = Date.now();
	const buildKey = getBuildKey(request.tag);
	const artifactCount = await buildArtifacts(request);

	return {
		state: 'ready',
		buildKey,
		artifactCount,
		durationMs: Date.now() - startedAt,
		builtAt: new Date().toISOString(),
	};
};
