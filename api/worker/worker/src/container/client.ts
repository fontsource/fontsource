import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
	type BuildFileRequest,
	type BuildVersionRequest,
	type BuildVersionRequestBase,
	type BuildVersionResponse,
	getBuildKey,
} from '../../../shared/build';
import type { AppEnv } from '../env';
import type { ResolvedFontRequest } from '../features/cdn/handler';

const buildVersion = async (
	c: Context<AppEnv>,
	requestBody: BuildVersionRequest,
): Promise<BuildVersionResponse> => {
	const buildKey = getBuildKey(requestBody.tag);
	// `getByName(buildKey)` guarantees that concurrent misses for the same exact
	// version share the same named container instance.
	try {
		return await c.env.ARTIFACT_BUILDER.getByName(buildKey).buildVersion(
			requestBody,
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);

		if (error instanceof HTTPException) {
			throw new HTTPException(error.status, {
				message,
			});
		}

		throw new HTTPException(502, {
			message: `Bad Gateway. Artifact build failed for ${buildKey}: ${message}`,
		});
	}
};

const buildRequestBase = (
	resolved: ResolvedFontRequest,
): BuildVersionRequestBase => ({
	tag: {
		id: resolved.tag.id,
		version: resolved.tag.version,
	},
	metadata: resolved.metadata,
	axes: resolved.axes,
});

/**
 * Ensures the resolved exact-version package exists by delegating to the
 * private container for that build key.
 */
export const ensureVersionBuilt = async (
	c: Context<AppEnv>,
	resolved: ResolvedFontRequest,
): Promise<BuildVersionResponse> =>
	buildVersion(c, {
		...buildRequestBase(resolved),
		mode: 'family',
	});

export const ensureFileBuilt = async (
	c: Context<AppEnv>,
	resolved: ResolvedFontRequest,
	file: string,
): Promise<BuildVersionResponse> =>
	buildVersion(c, {
		...buildRequestBase(resolved),
		mode: 'file',
		target: {
			file,
			isVariable: resolved.tag.isVariable,
		},
	} satisfies BuildFileRequest);
