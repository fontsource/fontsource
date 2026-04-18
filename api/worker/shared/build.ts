import type { SourceFontMetadata, VariableAxes } from './catalog';

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
export interface BuildVersionRequest {
	tag: BuildVersionTag;
	metadata: SourceFontMetadata;
	axes?: VariableAxes;
}

export interface BuildVersionResponse {
	state: 'ready' | 'failed';
	buildKey: string;
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
