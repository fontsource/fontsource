export interface Git {
	name: string;
	email: string;
}

export interface PackageJson {
	name: string;
	version: string;
	publishHash?: string;
}

export interface Context {
	packages: string[];
	commitMessage: string;
	updateMessage?: string;
	git?: Git;
	noVerify?: boolean;
	forcePublish?: boolean;
	yes?: boolean;
}

export interface ChangedFlags {
	packages?: string;
	ignoreExtension?: string;
	commitMessage?: string;
}
export interface ChangedObj {
	name: string;
	path: string;
	hash: string;
	version: string;
}

export type ChangedList = ChangedObj[];
export interface BumpFlags extends ChangedFlags {
	noVerify?: string;
	forcePublish?: boolean;
	yes?: boolean;
}

export type PublishFlags = BumpFlags;

export type Flags = ChangedFlags | BumpFlags | PublishFlags;

export interface BumpObject extends ChangedObj {
	bumpVersion: string;
	noPublish?: boolean;
}
