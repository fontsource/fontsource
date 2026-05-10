import type { SourceFontMetadata, VariableAxes } from './catalog';
import type { FontPackageTarget } from './font-package-manifest';

/**
 * Version target shared by the Worker and container.
 */
export interface BuildVersionTag {
	id: string;
	version: string;
}

/**
 * Worker-to-container build request.
 */
export interface BuildVersionRequestBase {
	tag: BuildVersionTag;
	metadata: SourceFontMetadata;
	axes?: VariableAxes;
}

export interface BuildFamilyRequest extends BuildVersionRequestBase {
	mode: 'family';
}

export interface BuildFileRequest extends BuildVersionRequestBase {
	mode: 'file';
	target: FontPackageTarget;
}

export type BuildVersionRequest = BuildFamilyRequest | BuildFileRequest;

export interface BuildVersionResponse {
	state: 'ready' | 'failed';
	buildKey: string;
	mode?: BuildVersionRequest['mode'];
	artifactCount?: number;
	durationMs?: number;
	error?: string;
}

/**
 * Exact version cache key. This is also the named container identity, so the
 * format must stay stable across both runtimes.
 */
export const getBuildKey = (tag: BuildVersionTag): string =>
	`build:${tag.id}@${tag.version}`;

export const getFamilyBuildRequestKey = (tag: BuildVersionTag): string =>
	`${getBuildKey(tag)}:family`;

export const getBuildRequestKey = (request: BuildVersionRequest): string =>
	request.mode === 'family'
		? getFamilyBuildRequestKey(request.tag)
		: [
				getBuildKey(request.tag),
				'file',
				request.target.isVariable ? 'variable' : 'static',
				request.target.file,
			].join(':');
