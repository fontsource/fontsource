import {
	getFont,
	getFontStats,
	getFontVersions,
	getRegistryFamily,
	getRegistryFamilySymbols,
	getRegistrySourceCapabilities,
	getVariableFont,
	listRegistryLanguages,
} from '@/generated/api';
import { getFontPreviewCSS } from '@/utils/font-preview';
import { selectRegistryFamilyLanguages } from '@/utils/registry';
import {
	loadOptionalRegistryData,
	loadRequiredRegistryData,
} from '@/utils/registry-request.server';

const loadFontFamilyRecord = async (id: string, signal: AbortSignal) => {
	const parameters = { id };
	const options = { signal };
	const metadataPromise = getFont(parameters, options);
	const versionsPromise = getFontVersions(parameters, options);
	const variablePromise = metadataPromise.then((metadata) =>
		metadata.variable ? getVariableFont(parameters, options) : undefined,
	);
	const registryPromise = loadRequiredRegistryData(
		getRegistryFamily(parameters, options),
		signal,
		'Font registry record',
	);
	const [metadata, versions, variable, registry] = await Promise.all([
		metadataPromise,
		versionsPromise,
		variablePromise,
		registryPromise,
	]);

	return {
		metadata,
		versions,
		variable,
		registry,
	};
};

const loadFontPageBase = async (id: string, signal: AbortSignal) => {
	const record = await loadFontFamilyRecord(id, signal);
	return {
		...record,
		...getFontPreviewCSS(record.metadata, record.variable),
	};
};

const loadFontPageStats = async (id: string, signal: AbortSignal) => {
	try {
		return await getFontStats({ id }, { signal });
	} catch (error) {
		if (signal.aborted) throw error;
		return undefined;
	}
};

type FontPageBase = Awaited<ReturnType<typeof loadFontPageBase>>;
type LanguageScope = 'family' | 'all';

const loadFontPageCapabilities = async (
	basePromise: Promise<FontPageBase>,
	signal: AbortSignal,
) => {
	const base = await basePromise;
	const capabilitySource = base.registry.sources.find(
		(source) => source.sha256 === base.registry.previewSource,
	);

	if (!capabilitySource) {
		throw new Response('The font preview source is invalid.', {
			status: 503,
			statusText: 'Service Unavailable',
		});
	}

	const capabilities = await loadRequiredRegistryData(
		getRegistrySourceCapabilities(
			{ sha256: capabilitySource.sha256 },
			{ signal },
		),
		signal,
		'Font character data',
	);
	return {
		capabilitySource,
		capabilities,
	};
};

const loadFontPageLanguages = async (
	basePromise: Promise<FontPageBase>,
	signal: AbortSignal,
	scope: LanguageScope = 'family',
) => {
	const [base, result] = await Promise.all([
		basePromise,
		loadRequiredRegistryData(
			listRegistryLanguages({ signal }),
			signal,
			'Language data',
		),
	]);
	return {
		languages:
			scope === 'all'
				? result
				: selectRegistryFamilyLanguages(base.registry, result),
	};
};

const loadFontPageSymbols = async (
	basePromise: Promise<FontPageBase>,
	signal: AbortSignal,
) => {
	const base = await basePromise;
	if (!base.registry.symbols) {
		return { symbols: undefined };
	}

	const result = await loadOptionalRegistryData(
		getRegistryFamilySymbols({ id: base.metadata.id }, { signal }),
		signal,
		'Font symbol catalog',
	);
	return { symbols: result };
};

export {
	loadFontPageBase,
	loadFontPageCapabilities,
	loadFontPageLanguages,
	loadFontPageStats,
	loadFontPageSymbols,
};
