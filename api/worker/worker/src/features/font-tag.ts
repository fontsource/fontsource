import {
	compareVersions,
	satisfies as versionSatisfies,
} from 'compare-versions';
import { badRequest, notFound } from '../utils/errors';

export interface ParsedFontTag {
	id: string;
	isVariable: boolean;
	version: string;
}

const VERSION_PREFIX_PATTERN = /^v/i;
const EXACT_VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
const PUBLISHED_VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const MAJOR_ONLY_PATTERN = /^(\d+)$/;
const MAJOR_MINOR_PATTERN = /^(\d+)\.(\d+)$/;
const MIN_SUPPORTED_CDN_MAJOR = 5;

const normalizeVersion = (version: string): string =>
	version.replace(VERSION_PREFIX_PATTERN, '');

/**
 * Normalises, deduplicates, and sorts a version list in descending semver order.
 * Versions that do not match the exact `MAJOR.MINOR.PATCH` format are discarded.
 */
export const sortVersionsDesc = (versions: readonly string[]): string[] => {
	const seen = new Set<string>();

	return versions
		.map(normalizeVersion)
		.filter((value) => EXACT_VERSION_PATTERN.test(value))
		.filter((value) => {
			if (seen.has(value)) {
				return false;
			}

			seen.add(value);
			return true;
		})
		.sort((left, right) => compareVersions(right, left));
};

/**
 * Normalises, deduplicates, and sorts the published version list for metadata
 * responses. Unlike `sortVersionsDesc`, this retains prerelease entries so the
 * public `/v1/version` payload matches the published registry.
 */
export const sortPublishedVersionsDesc = (
	versions: readonly string[],
): string[] => {
	const seen = new Set<string>();

	return versions
		.map(normalizeVersion)
		.filter((value) => PUBLISHED_VERSION_PATTERN.test(value))
		.filter((value) => {
			if (seen.has(value)) {
				return false;
			}

			seen.add(value);
			return true;
		})
		.sort((left, right) => compareVersions(right, left));
};

/** Returns true when `version` is an exact `MAJOR.MINOR.PATCH` string. */
export const isPinnedVersion = (version: string): boolean =>
	EXACT_VERSION_PATTERN.test(normalizeVersion(version));

const isBelowSupportedCdnMajor = (version: string): boolean => {
	const requested = normalizeVersion(version);
	const match = /^(\d+)(?:\.\d+){0,2}$/.exec(requested);

	return match ? Number(match[1]) < MIN_SUPPORTED_CDN_MAJOR : false;
};

/**
 * Parses a CDN font tag into its constituent parts.
 *
 * The accepted formats are:
 *   - Static package: `{id}@{version}`, e.g. `roboto@1.2.3` or `roboto@latest`
 *   - Variable package: `{id}:vf@{version}`, e.g. `roboto:vf@latest`
 *
 * Throws 400 for any structurally invalid tag.
 */
export const parseFontTag = (tag: string): ParsedFontTag => {
	const [rawId = '', rawVersion = '', ...extraVersions] = tag.split('@');

	if (extraVersions.length > 0) {
		throw badRequest('Invalid font tag: malformed tag');
	}

	const [id = '', variableSuffix, ...extraSuffixes] = rawId.split(':');

	if (!id) {
		throw badRequest('Invalid font tag: missing font id');
	}

	if (!rawVersion) {
		throw badRequest('Invalid font tag: missing version');
	}

	if (
		extraSuffixes.length > 0 ||
		(typeof variableSuffix === 'string' && variableSuffix !== 'vf')
	) {
		throw badRequest('Invalid font tag: unsupported variable suffix');
	}

	const version = normalizeVersion(rawVersion);

	if (version !== 'latest' && isBelowSupportedCdnMajor(version)) {
		throw badRequest('Bad Request. Version tags below @5 are not supported.');
	}

	return {
		id,
		isVariable: variableSuffix === 'vf',
		version,
	};
};

/**
 * Resolves a floating version specifier against a published version list.
 *
 * Accepts:
 *   - `"latest"`: the highest available version
 *   - `"1.2.3"`: an exact pinned version (must exist)
 *   - `"1.2"` / `"1"`: the highest patch/minor within that range
 *
 * Throws 404 when no version satisfies the request, and 400 for unrecognised
 * specifier formats.
 */
export const resolveVersionTag = (
	version: string,
	versions: readonly string[],
): string => {
	const normalized = sortVersionsDesc(versions);

	if (normalized.length === 0) {
		throw notFound('Unable to resolve version: no versions available');
	}

	const requested = normalizeVersion(version);

	if (requested === 'latest') {
		return normalized[0];
	}

	if (EXACT_VERSION_PATTERN.test(requested)) {
		const matched = normalized.find((candidate) => candidate === requested);
		if (!matched) {
			throw notFound(`Unable to resolve version "${version}"`);
		}

		return matched;
	}

	const range = MAJOR_MINOR_PATTERN.test(requested)
		? `${requested}.x`
		: MAJOR_ONLY_PATTERN.test(requested)
			? `${requested}.x.x`
			: undefined;

	if (!range) {
		throw badRequest(`Unable to resolve version: invalid version "${version}"`);
	}

	const matched = normalized.find((candidate) =>
		versionSatisfies(candidate, range),
	);
	if (!matched) {
		throw notFound(`Unable to resolve version "${version}"`);
	}

	return matched;
};
