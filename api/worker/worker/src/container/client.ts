import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
	type BuildVersionRequest,
	type BuildVersionResponse,
	getBuildKey,
} from '../../../shared/build';
import type { AppEnv } from '../env';
import type { ResolvedFontRequest } from '../features/cdn/handler';

/**
 * Ensures the resolved exact-version package exists by delegating to the
 * private container for that build key.
 */
export const ensureVersionBuilt = async (
	c: Context<AppEnv>,
	resolved: ResolvedFontRequest,
): Promise<BuildVersionResponse> => {
	const requestBody: BuildVersionRequest = {
		tag: {
			id: resolved.tag.id,
			version: resolved.tag.version,
		},
		metadata: resolved.metadata,
		axes: resolved.axes,
	};
	const buildKey = getBuildKey(requestBody.tag);
	// `getByName(buildKey)` guarantees that concurrent misses for the same exact
	// version share the same named container instance.
	try {
		return await c.env.ARTIFACT_BUILDER.getByName(buildKey).buildVersion(
			requestBody,
		);
	} catch (error) {
		throw new HTTPException(502, {
			message: `Bad Gateway. Artifact build failed for ${buildKey}: ${error instanceof Error ? error.message : String(error)}`,
		});
	}
};
