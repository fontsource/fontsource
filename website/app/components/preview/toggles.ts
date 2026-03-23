/**
 * Toggle one active key in a sparse selection map where only enabled entries
 * are stored.
 */
export const toggleKey = (
	values: Record<string, boolean>,
	value: string | number,
): Record<string, boolean> => {
	const key = String(value);
	const next = { ...values };

	if (next[key]) {
		delete next[key];
	} else {
		next[key] = true;
	}

	return next;
};

/**
 * Toggle one active key while ensuring at least one key stays selected.
 */
export const toggleKeyKeepOne = (
	values: Record<string, boolean>,
	value: string | number,
): Record<string, boolean> => {
	const next = toggleKey(values, value);
	return Object.keys(next).length === 0 ? values : next;
};

/**
 * Toggle one variable axis while keeping `wght` enabled, since published
 * variable entrypoints always include the weight axis.
 */
export const toggleVariableAxis = (
	axes: Record<string, boolean>,
	value: string | number,
): Record<string, boolean> => ({
	...toggleKey(axes, value),
	wght: true,
});
