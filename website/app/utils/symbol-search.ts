import { create, insertMultiple, search, type ZBSearch } from 'zbsearch';

export interface SearchableSymbol {
	name: string;
	codepoint: number;
}

const symbolSearchSchema = {
	key: 'string',
	name: 'string',
} as const;

interface SymbolSearchDocument {
	key: string;
	name: string;
}

interface SymbolSearchIndex {
	database: ZBSearch<typeof symbolSearchSchema>;
	documents: SymbolSearchDocument[];
	symbols: readonly SearchableSymbol[];
}

const normalizeSymbolName = (value: string) =>
	value.trim().toLowerCase().replace(/[_-]+/g, ' ');

export const symbolSearchSeparator = '\u0000';
export const getSymbolSearchKey = ({ name, codepoint }: SearchableSymbol) =>
	`${name}${symbolSearchSeparator}${codepoint}`;

export const createSymbolSearch = (
	symbols: readonly SearchableSymbol[],
): SymbolSearchIndex => {
	const database = create({ schema: symbolSearchSchema });
	const documents = symbols.map((symbol) => ({
		key: getSymbolSearchKey(symbol),
		name: normalizeSymbolName(symbol.name),
	}));

	insertMultiple(database, documents);

	return { database, documents, symbols };
};

export const searchSymbolCatalog = (
	index: ReturnType<typeof createSymbolSearch>,
	query: string,
) => {
	const trimmed = query.trim();
	if (!trimmed) return index.documents.map((document) => document.key);

	const enteredCharacter = Array.from(trimmed);
	if (enteredCharacter.length === 1) {
		const codepoint = enteredCharacter[0]?.codePointAt(0);
		const exactCharacters = index.symbols.filter(
			(symbol) => symbol.codepoint === codepoint,
		);
		if (exactCharacters.length > 0) {
			return exactCharacters.map(getSymbolSearchKey);
		}
	}

	const codepointQuery =
		trimmed.match(/^u\+([0-9a-f]{1,6})$/i)?.[1] ??
		trimmed.match(/^(?=[0-9a-f]*[0-9])[0-9a-f]{4,6}$/i)?.[0] ??
		'';
	if (codepointQuery) {
		return index.symbols
			.filter((symbol) =>
				symbol.codepoint.toString(16).startsWith(codepointQuery.toLowerCase()),
			)
			.map(getSymbolSearchKey);
	}

	const normalized = normalizeSymbolName(trimmed);
	const directMatches = index.documents
		.map((document) => ({
			document,
			rank:
				document.name === normalized
					? 0
					: document.name.startsWith(normalized)
						? 1
						: document.name
									.split(' ')
									.some((token) => token.startsWith(normalized))
							? 2
							: document.name.includes(normalized)
								? 3
								: undefined,
		}))
		.filter(
			(match): match is { document: SymbolSearchDocument; rank: number } =>
				match.rank !== undefined,
		)
		.sort((left, right) => left.rank - right.rank)
		.map((match) => match.document);

	if (normalized.length < 3) {
		return directMatches.map((document) => document.key);
	}

	const results = search(index.database, {
		term: normalized,
		properties: ['name'],
		tolerance: 1,
		limit: index.documents.length,
		threshold: 0,
	});
	if (results instanceof Promise) {
		throw new TypeError('Symbol search must remain synchronous');
	}

	return Array.from(
		new Set([
			...directMatches.map((document) => document.key),
			...results.hits.map((hit) => hit.document.key),
		]),
	);
};
