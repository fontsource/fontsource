/**
 * Converts a date-like value into a valid HTTP date string.
 */
export const toHttpDate = (
	value: Date | string | undefined,
): string | undefined => {
	if (!value) {
		return undefined;
	}

	const date = value instanceof Date ? value : new Date(value);

	if (Number.isNaN(date.getTime())) {
		return undefined;
	}

	return date.toUTCString();
};
