/**
 * Toggle one active key in a sparse selection map where only enabled entries
 * are stored.
 */
export const toggleActiveKey = (
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
export const toggleActiveKeyKeepingOne = (
	values: Record<string, boolean>,
	value: string | number,
): Record<string, boolean> => {
	const next = toggleActiveKey(values, value);
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
	...toggleActiveKey(axes, value),
	wght: true,
});
