interface FontBinaryTag {
	id: string;
	isVariable: boolean;
	version: string;
}

export const getDownloadKey = (
	id: string,
	staticVersion?: string,
	variableVersion?: string,
): string => {
	if (!staticVersion) {
		if (!variableVersion) {
			throw new Error(`Download version required for ${id}`);
		}
		return `${id}:vf@${variableVersion}/download.zip`;
	}

	return variableVersion && variableVersion !== staticVersion
		? `${id}@${staticVersion}+vf@${variableVersion}/download.zip`
		: `${id}@${staticVersion}/download.zip`;
};

/**
 * Static binaries live directly under `<id>@<version>/...`.
 */
export const getStaticAssetKey = (
	id: string,
	version: string,
	file: string,
): string => `${id}@${version}/${file}`;

/**
 * Variable binaries live under `variable/` so they do not collide with static
 * package files.
 */
export const getVariableAssetKey = (
	id: string,
	version: string,
	file: string,
): string => `${id}@${version}/variable/${file}`;

/**
 * Resolves the final R2 key for any published binary artifact.
 */
export const getBinaryKey = (tag: FontBinaryTag, file: string): string =>
	tag.isVariable
		? getVariableAssetKey(tag.id, tag.version, file)
		: getStaticAssetKey(tag.id, tag.version, file);
