export interface Git {
	name: string;
	email: string;
}

export interface PackageJson {
	name: string;
	version: string;
}

export interface Config {
	packages: string[];
	ignoreExtension?: string[];
	commitMessage: string;
	updateMessage?: string;
	git?: Git;
	commitFrom: string;
	commitTo?: string;
	noVerify?: boolean;
	forcePublish?: boolean;
	yes?: boolean;
}

export interface ChangedFlags {
	packages?: string
	ignoreExtension?: string
	commitMessage?: string
	commitFrom?: string
	commitTo?: string
}

export interface BumpFlags extends ChangedFlags {
	noVerify?: string
	forcePublish?: boolean
	yes?: boolean
}

export type PublishFlags = BumpFlags

export type Flags = ChangedFlags | BumpFlags | PublishFlags

export interface BumpObject {
	packageFile: PackageJson;
	packagePath: string;
	bumpedVersion: string | false;
	noPublish?: boolean;
}
