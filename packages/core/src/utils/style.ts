import type { StyleValue } from '@glypht/core';
import type { FontStyle, VariableFontAxis } from '../types';

/** Read a numeric style value from static or variable Glypht output. */
export const extractStyleValue = (value: StyleValue | number): number => {
	if (typeof value === 'number') {
		return value;
	}

	if (value.type === 'single') {
		return value.value;
	}

	return value.value.defaultValue;
};

export const formatAxisValue = (axis: VariableFontAxis): string =>
	String(axis.min) === String(axis.max)
		? String(axis.min)
		: `${axis.min} ${axis.max}`;

/**
 * Fontsource-style published assets collapse oblique faces into `italic`.
 */
export const formatStyle = (style: FontStyle): 'normal' | 'italic' => {
	if (style === 'normal' || style === 'italic') {
		return style;
	}

	return 'italic';
};

export const formatStretchValue = (axis: VariableFontAxis): string =>
	String(axis.min) === String(axis.max)
		? `${axis.min}%`
		: `${axis.min}% ${axis.max}%`;

export const formatSlantValue = (axis: VariableFontAxis): string => {
	const min = Number(axis.min);
	const max = Number(axis.max);
	const minDegrees = Math.abs(min);
	const maxDegrees = Math.abs(max);

	return min === max
		? `${minDegrees}deg`
		: `${Math.min(minDegrees, maxDegrees)}deg ${Math.max(minDegrees, maxDegrees)}deg`;
};

export const findClosestWeight = (weights: number[], target = 400): number => {
	if (weights.length === 0) return target;
	return weights.reduce((closest, current) => {
		const closestDiff = Math.abs(closest - target);
		const currentDiff = Math.abs(current - target);
		return currentDiff < closestDiff ||
			(currentDiff === closestDiff && current > closest)
			? current
			: closest;
	}, weights[0] as number);
};
