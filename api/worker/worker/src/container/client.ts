import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import {
	type BuildDownloadRequest,
	type BuildPackageRequest,
	type BuildVersionFailure,
	type BuildVersionRequest,
	type BuildVersionResponse,
	type BuildVersionResult,
	type BuildVersionStatus,
	getBuildKey,
} from '../../../shared/build';
import type { AppEnv } from '../env';
import type { ResolvedFontRequest } from '../features/cdn/handler';

const buildVersion = async (
	c: Context<AppEnv>,
	requestBody: BuildVersionRequest,
): Promise<BuildVersionResponse> => {
	const buildKey = getBuildKey(requestBody);
	let result: BuildVersionResult;

	try {
		result =
			await c.env.ARTIFACT_BUILDER.getByName(buildKey).buildVersion(
				requestBody,
			);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new HTTPException(502, {
			message: `Artifact builder request failed (${buildKey}): ${message}`,
		});
	}

	if (result.state === 'failed') {
		return throwBuildFailure(result);
	}

	return result;
};

const throwBuildFailure = (failure: BuildVersionFailure): never => {
	throw new HTTPException(failure.status as ContentfulStatusCode, {
		message: failure.error,
	});
};

export const startDownloadBuild = async (
	c: Context<AppEnv>,
	request: BuildDownloadRequest,
): Promise<Exclude<BuildVersionStatus, BuildVersionFailure>> => {
	const buildKey = getBuildKey(request);
	let result: BuildVersionStatus;

	try {
		result =
			await c.env.ARTIFACT_BUILDER.getByName(buildKey).startBuild(request);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new HTTPException(502, {
			message: `Artifact builder request failed (${buildKey}): ${message}`,
		});
	}

	if (result.state === 'failed') {
		return throwBuildFailure(result);
	}

	return result;
};

export const ensurePackageBuilt = async (
	c: Context<AppEnv>,
	resolved: ResolvedFontRequest,
): Promise<BuildVersionResponse> =>
	buildVersion(c, {
		mode: resolved.tag.isVariable ? 'variable' : 'static',
		tag: {
			id: resolved.tag.id,
			version: resolved.tag.version,
		},
		metadata: resolved.metadata,
	} satisfies BuildPackageRequest);
