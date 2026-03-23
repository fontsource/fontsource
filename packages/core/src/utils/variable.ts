import type { FontStyle, VariableAxisConfig, VariableAxisKey } from '../types';
import { formatSlantValue, formatStretchValue } from './style';

const STANDARD_PUBLISHED_AXES = new Set(['wght', 'wdth', 'slnt', 'opsz']);
const STANDARD_VARIABLE_AXES = new Set([
	'wght',
	'wdth',
	'slnt',
	'opsz',
	'ital',
]);
const ALWAYS_INCLUDED_VARIABLE_AXES = new Set(['wght', 'ital']);

/**
 * Pick the default published axis key for a variable family.
 */
export const determineAxisKey = (
	variableConfig: VariableAxisConfig,
): VariableAxisKey => {
	// Filter out any inactive axes and `ital` since it's always included.
	const active = Object.keys(variableConfig).filter((axisKey) =>
		Boolean(variableConfig[axisKey]),
	);

	if (active.length === 0) {
		return 'wght'; // Default.
	}

	const standard = active.filter((axisKey) =>
		STANDARD_VARIABLE_AXES.has(axisKey),
	);
	const custom = active.filter(
		(axisKey) => !STANDARD_VARIABLE_AXES.has(axisKey),
	);

	// If there are any custom axes, we prefer those as the default entrypoint since they
	// are more specific. If there's more than one custom axis, we fall back to `full`.
	if (custom.length > 0) {
		return standard.length > 0 || custom.length > 1
			? 'full'
			: (custom[0] ?? '');
	}

	// If there are no custom axes, we prefer the standard axes.
	// If there's more than one, we fall back to `standard`.
	return standard.length > 1 ? 'standard' : (standard[0] ?? '');
};

/**
 * Return every published axis key from a variable font config.
 */
export const getVariableAxisKeys = (
	variableConfig: VariableAxisConfig,
): VariableAxisKey[] => {
	// Filter out any inactive axes and `ital` since it's always included.
	const direct = Object.keys(variableConfig).filter(
		(axisKey) => axisKey !== 'ital' && Boolean(variableConfig[axisKey]),
	);

	const axisKeys = new Set(direct);
	const standardAxes = direct.filter((key) => STANDARD_PUBLISHED_AXES.has(key));
	const customAxes = direct.filter((key) => !STANDARD_PUBLISHED_AXES.has(key));

	if (standardAxes.length > 1) {
		axisKeys.add('standard');
	}

	if (customAxes.length > 0) {
		axisKeys.add('full');
	}

	return Array.from(axisKeys);
};

/** Return the published CSS `font-style` for one axis key variant. */
export const getFaceStyle = (
	axisKey: VariableAxisKey,
	style: FontStyle,
	variableConfig: VariableAxisConfig,
): FontStyle => {
	const includesSlant =
		axisKey === 'slnt' || axisKey === 'standard' || axisKey === 'full';

	if (includesSlant && variableConfig.slnt) {
		return `oblique ${formatSlantValue(variableConfig.slnt)}` as FontStyle;
	}

	return style;
};

/** Return the published CSS `font-stretch` for one axis key variant. */
export const getFaceStretch = (
	axisKey: VariableAxisKey,
	variableConfig: VariableAxisConfig,
): string | null => {
	const includesStretch =
		axisKey === 'wdth' || axisKey === 'standard' || axisKey === 'full';

	if (includesStretch && variableConfig.wdth) {
		return formatStretchValue(variableConfig.wdth);
	}

	return null;
};

/** Filter a variable config to only the axes relevant to `axisKey`. */
export const pickAxisConfig = (
	variableConfig: VariableAxisConfig,
	axisKey: VariableAxisKey,
): VariableAxisConfig => {
	if (axisKey === 'full') return { ...variableConfig };

	const allowed =
		axisKey === 'standard'
			? STANDARD_VARIABLE_AXES
			: new Set([...ALWAYS_INCLUDED_VARIABLE_AXES, axisKey]);

	return Object.fromEntries(
		Object.entries(variableConfig).filter(
			([key, axis]) => Boolean(axis) && allowed.has(key),
		),
	);
};

const findAxisKey = (
	axisKeys: readonly VariableAxisKey[],
	candidate: string,
): VariableAxisKey | undefined =>
	axisKeys.find((axisKey) => axisKey.toLowerCase() === candidate.toLowerCase());

/**
 * Pick the smallest published axis key that can satisfy a selected set of axes. For example:
 *
 * - `wght` only -> `wght`
 * - `wght` plus one extra axis -> that direct axis key
 * - multiple standard axes -> `standard`
 * - anything involving multiple custom axes -> `full`
 */
export const selectVariableAxisKey = (
	variableConfig: VariableAxisConfig,
	selectedAxes: Iterable<string>,
): VariableAxisKey => {
	const publishedAxisKeys = getVariableAxisKeys(variableConfig);
	const defaultKey = determineAxisKey(variableConfig);

	// Normalize all axes for comparison.
	const activeAxes = Array.from(selectedAxes)
		.map((axis) => axis.trim().toLowerCase())
		.filter(Boolean)
		.filter((axis) => axis !== 'ital');

	// Deduplicate after normalization.
	const uniqueAxes = [...new Set(activeAxes)];

	if (uniqueAxes.length === 0) {
		return defaultKey;
	}

	// Single axis should go for a direct lookup.
	if (uniqueAxes.length === 1) {
		return findAxisKey(publishedAxisKeys, uniqueAxes[0]) ?? defaultKey;
	}

	// Two axes where one is `wght` should still try for a direct lookup of the other axis as `wght` is implicit in most bundles.
	if (uniqueAxes.length === 2 && uniqueAxes.includes('wght')) {
		const directAxis = uniqueAxes.find((axis) => axis !== 'wght');

		if (directAxis) {
			const directAxisKey = findAxisKey(publishedAxisKeys, directAxis);
			if (directAxisKey) {
				return directAxisKey;
			}
		}
	}

	// If every requested axis is a standard axis, try the `standard` bundle.
	const allStandard = uniqueAxes.every((axis) =>
		STANDARD_VARIABLE_AXES.has(axis),
	);

	if (allStandard) {
		const standardAxisKey = findAxisKey(publishedAxisKeys, 'standard');
		if (standardAxisKey) {
			return standardAxisKey;
		}
	}

	// Fall back to the `full` bundle which contains every axis.
	return findAxisKey(publishedAxisKeys, 'full') ?? defaultKey;
};

/**
 * Return the axis keys a caller actually wants to emit. Providing an empty list defaults to all
 * axis keys.
 */
export const getRequestedAxisKeys = (
	variableConfig: VariableAxisConfig,
	axisKeys: readonly VariableAxisKey[] | undefined,
): VariableAxisKey[] => {
	// Filter out any empty keys.
	const normalized = axisKeys?.map((key) => key.trim()).filter(Boolean);

	if (normalized && normalized.length > 0) {
		return [...new Set(normalized)];
	}

	// Default to all keys if the caller didn't specify any.
	return getVariableAxisKeys(variableConfig);
};
