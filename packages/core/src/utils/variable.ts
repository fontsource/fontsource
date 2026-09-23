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
	const active = Object.keys(variableConfig).filter(
		(axisKey) => axisKey !== 'ital' && Boolean(variableConfig[axisKey]),
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
		return standard.length > 0 || custom.length > 1 ? 'full' : custom[0];
	}

	// If there are no custom axes, we prefer the standard axes.
	// If there's more than one, we fall back to `standard`.
	return standard.length > 1 ? 'standard' : standard[0];
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

/**
 * Select the smallest published bundle for metadata axis tags.
 * Callers supply distinct tags with their original OpenType casing.
 */
export const selectVariableAxisKey = (
	variableConfig: VariableAxisConfig,
	selectedAxes: readonly string[],
): VariableAxisKey => {
	const published = getVariableAxisKeys(variableConfig);
	const defaultKey = determineAxisKey(variableConfig);
	// Weight and italic are implicit in the other published bundles.
	const axes = selectedAxes.filter((axis) => axis !== 'ital');
	if (axes.length === 0) return defaultKey;
	if (axes.length === 1) {
		return published.includes(axes[0]) ? axes[0] : defaultKey;
	}

	const extraAxes = axes.filter((axis) => axis !== 'wght');
	if (extraAxes.length === 1 && published.includes(extraAxes[0])) {
		return extraAxes[0];
	}
	if (
		axes.every((axis) => STANDARD_VARIABLE_AXES.has(axis)) &&
		published.includes('standard')
	) {
		return 'standard';
	}
	return published.includes('full') ? 'full' : defaultKey;
};
