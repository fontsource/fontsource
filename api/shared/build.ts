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
}

export interface BuildDownloadRequest {
	mode: 'download';
	staticVersion?: string;
	variableVersion?: string;
	id: string;
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

interface BuildVersionBuilding {
	state: 'building';
	buildKey: string;
}

export type BuildVersionResult = BuildVersionResponse | BuildVersionFailure;
export type BuildVersionStatus = BuildVersionBuilding | BuildVersionFailure;

export const getBuildKey = (request: BuildVersionRequest): string =>
	request.mode === 'download'
		? request.staticVersion
			? `build:${request.id}@${request.staticVersion}${request.variableVersion && request.variableVersion !== request.staticVersion ? `+vf@${request.variableVersion}` : ''}:download`
			: `build:${request.id}:vf@${request.variableVersion}:download`
		: `build:${request.tag.id}@${request.tag.version}:${request.mode}`;
