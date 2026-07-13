import type { SourceFontMetadata } from './catalog';
/**
 * Version target shared by the Worker and container.
 */
export interface BuildVersionTag {
	id: string;
	version: string;
}

export interface BuildPackageRequest {
	mode: 'static' | 'variable';
	tag: BuildVersionTag;
	metadata: SourceFontMetadata;
}

export interface BuildDownloadRequest {
	mode: 'download';
	staticVersion?: string;
	variableVersion?: string;
	metadata: SourceFontMetadata;
}

export type BuildVersionRequest = BuildDownloadRequest | BuildPackageRequest;

export interface BuildVersionResponse {
	state: 'ready';
	buildKey: string;
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
		? request.staticVersion
			? `build:${request.metadata.id}@${request.staticVersion}${request.variableVersion && request.variableVersion !== request.staticVersion ? `+vf@${request.variableVersion}` : ''}:download`
			: `build:${request.metadata.id}:vf@${request.variableVersion}:download`
		: `build:${request.tag.id}@${request.tag.version}:${request.mode}`;
