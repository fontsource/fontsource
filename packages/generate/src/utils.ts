import { Axes } from './types';

// Find the lowest and highest value in a weight array
export const getVariableWght = (axes: Axes) => {
	if (!axes) return '400';

	if (axes.min === axes.max) return `${axes.min}`;

	return `${axes.min} ${axes.max}`;
};
