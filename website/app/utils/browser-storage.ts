const deserializeStoredChoice = <T>(
	value: string | undefined,
	choices: readonly T[],
	fallback: T,
): T => {
	if (value === undefined) return fallback;

	let parsed: unknown = value;
	try {
		parsed = JSON.parse(value);
	} catch {
		// Older callers may have stored a raw string instead of JSON.
	}

	return choices.some((choice) => Object.is(choice, parsed))
		? (parsed as T)
		: fallback;
};

export { deserializeStoredChoice };
