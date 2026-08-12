const deserializeStoredChoice = <T>(
	value: string | undefined,
	choices: readonly T[],
	fallback: T,
): T => {
	if (value === undefined) return fallback;

	let parsed: unknown;
	try {
		parsed = JSON.parse(value);
	} catch {
		return fallback;
	}

	return choices.some((choice) => Object.is(choice, parsed))
		? (parsed as T)
		: fallback;
};

interface StoredValueSchema<T> {
	safeParse(value: unknown): { success: true; data: T } | { success: false };
}

type StoredValueResult<T> =
	| { status: 'missing' }
	| { status: 'valid'; value: T }
	| { status: 'invalid' }
	| { status: 'unavailable' };

const readStoredValue = <T>(
	storage: Storage,
	key: string,
	schema: StoredValueSchema<T>,
): StoredValueResult<T> => {
	let value: string | null;
	try {
		value = storage.getItem(key);
	} catch {
		return { status: 'unavailable' };
	}

	if (value === null) return { status: 'missing' };

	let parsed: unknown;
	try {
		parsed = JSON.parse(value);
	} catch {
		return { status: 'invalid' };
	}

	const result = schema.safeParse(parsed);
	return result.success
		? { status: 'valid', value: result.data }
		: { status: 'invalid' };
};

export { deserializeStoredChoice, readStoredValue, type StoredValueSchema };
