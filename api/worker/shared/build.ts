import type { SourceFontMetadata } from './catalog';
import type { FontPackageTarget } from './font-package-manifest';

/**
 * Version target shared by the Worker and container.
 */
export interface BuildVersionTag {
	id: string;
	version: string;
}

export interface BuildFileRequest {
	mode: 'file';
	tag: BuildVersionTag;
	metadata: SourceFontMetadata;
	target: FontPackageTarget;
}

export interface BuildDownloadRequest {
	mode: 'download';
	staticVersion: string;
	variableVersion?: string;
	metadata: SourceFontMetadata;
}

export type BuildVersionRequest = BuildDownloadRequest | BuildFileRequest;

export interface BuildVersionResponse {
	state: 'ready';
	buildKey: string;
	mode?: BuildVersionRequest['mode'];
	artifactCount?: number;
	durationMs?: number;
}

export interface BuildVersionFailure {
	state: 'failed';
	buildKey: string;
	status: number;
	error: string;
}

export interface BuildVersionBuilding {
	state: 'building';
	buildKey: string;
}

export type BuildVersionResult = BuildVersionResponse | BuildVersionFailure;
export type BuildVersionStatus = BuildVersionBuilding | BuildVersionFailure;

export const getBuildKey = (request: BuildVersionRequest): string =>
	request.mode === 'download'
		? `build:${request.metadata.id}@${request.staticVersion}${request.variableVersion && request.variableVersion !== request.staticVersion ? `+vf@${request.variableVersion}` : ''}`
		: `build:${request.tag.id}@${request.tag.version}`;

export const getBuildRequestKey = (request: BuildVersionRequest): string =>
	request.mode === 'download'
		? `${getBuildKey(request)}:download`
		: [
				getBuildKey(request),
				'file',
				request.target.isVariable ? 'variable' : 'static',
				request.target.file,
			].join(':');
