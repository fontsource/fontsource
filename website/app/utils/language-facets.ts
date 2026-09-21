import type {
	SearchClient,
	SearchOptions,
	SearchResponse,
	SearchResponses,
} from 'instantsearch.js';

import type { GetRegistryLanguageIndexResponse } from '@/generated/api';

// Stay below Algolia's pagination and combined-filter limits.
const BATCH_SIZE = 500;

const isSearchResponse = <T>(
	response: SearchResponses<T>['results'][number],
): response is SearchResponse<T> & { nbHits: number } =>
	'hits' in response &&
	Array.isArray(response.hits) &&
	typeof response.nbHits === 'number';

export const createLanguageSearchClient = (
	client: SearchClient,
	languageIndex: GetRegistryLanguageIndexResponse,
	legacyFamilyIds: string[] = [],
): SearchClient => {
	const legacyFamilies = new Set(legacyFamilyIds);
	const families = [...languageIndex.families, ...legacyFamilies];
	const familyPositions = new Map(
		languageIndex.families.map((id, index) => [id, index]),
	);
	const languageBits = Object.entries(languageIndex.languages).map(
		([id, encoded]) =>
			[
				id,
				Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0)),
			] as const,
	);

	const countLanguages = (ids: Set<string>) => {
		const matches = new Uint8Array(
			Math.ceil(languageIndex.families.length / 8),
		);
		for (const id of ids) {
			const index = familyPositions.get(id);
			if (index === undefined) {
				// The matching index version guarantees catalog-only fonts have no languages.
				if (legacyFamilies.has(id)) continue;
				return undefined;
			}
			matches[index >> 3] |= 1 << (index & 7);
		}
		return Object.fromEntries(
			languageBits.map(([id, bits]) => {
				let count = 0;
				for (let index = 0; index < matches.length; index++) {
					let byte = matches[index] & bits[index];
					while (byte) {
						byte &= byte - 1;
						count++;
					}
				}
				return [id, count];
			}),
		);
	};

	const getLanguageCounts = async <T>(
		indexName: string,
		params: SearchOptions,
		result: SearchResponse<T> & { nbHits: number },
	) => {
		if (
			result.queryAfterRemoval ||
			(result.exhaustive?.nbHits ?? result.exhaustiveNbHits) !== true
		)
			return undefined;
		if (
			result.hits.some(
				(hit) =>
					!('languageIndexVersion' in hit) ||
					hit.languageIndexVersion !== languageIndex.version,
			)
		)
			return undefined;
		let ids = new Set(result.hits.map((hit) => hit.objectID));
		if (ids.size !== result.nbHits) {
			const idParams: SearchOptions = {
				...params,
				removeWordsIfNoResults: 'none',
				page: 0,
				hitsPerPage: 1000,
				facets: [],
				attributesToRetrieve: ['objectID', 'languageIndexVersion'],
				attributesToHighlight: [],
				attributesToSnippet: [],
				analytics: false,
				clickAnalytics: false,
			};
			const requests = [];
			if (result.nbHits <= 1000) {
				requests.push({ indexName, params: idParams });
			} else {
				for (let offset = 0; offset < families.length; offset += BATCH_SIZE) {
					const filter = families
						.slice(offset, offset + BATCH_SIZE)
						.map((id) => `objectID:${JSON.stringify(id)}`)
						.join(' OR ');
					requests.push({
						indexName,
						params: {
							...idParams,
							hitsPerPage: BATCH_SIZE,
							filters: params.filters
								? `(${params.filters}) AND (${filter})`
								: filter,
						},
					});
				}
			}
			const matches = await client.search(requests);
			ids = new Set<string>();
			for (const response of matches.results) {
				if (
					!isSearchResponse(response) ||
					response.hits.length !== response.nbHits ||
					(response.exhaustive?.nbHits ?? response.exhaustiveNbHits) !== true
				)
					return undefined;
				for (const hit of response.hits) {
					if (
						!('languageIndexVersion' in hit) ||
						hit.languageIndexVersion !== languageIndex.version
					)
						return undefined;
					ids.add(hit.objectID);
				}
			}
		}
		// Registry and search publish independently. Never turn a partial match set into zeros.
		return ids.size === result.nbHits ? countLanguages(ids) : undefined;
	};

	return {
		...client,
		async search<T>(requests: Parameters<SearchClient['search']>[0]) {
			const response = await client.search<T>(requests);
			const results = await Promise.all(
				response.results.map(async (result, index) => {
					const { indexName, params } = requests[index];
					if (
						!isSearchResponse(result) ||
						!params.facets?.includes('languageIds')
					)
						return result;
					const counts = await getLanguageCounts(
						indexName,
						params,
						result,
					).catch(() => {
						console.warn('Unable to complete language facet counts');
						return undefined;
					});
					return counts
						? { ...result, facets: { ...result.facets, languageIds: counts } }
						: result;
				}),
			);
			return { ...response, results };
		},
	};
};
