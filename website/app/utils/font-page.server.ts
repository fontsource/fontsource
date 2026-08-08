import {
	getFont,
	getFontStats,
	getRegistryFamily,
	getRegistryFamilySymbols,
	getRegistrySourceCapabilities,
	getVariableFont,
	listRegistryLanguages,
} from '@/generated/api';
import { getFontPreviewCSS } from '@/utils/font-preview';
import { selectRegistryFamilyLanguages } from '@/utils/registry';
import { loadOptionalRegistryData } from '@/utils/registry-request.server';

const loadFontPageBase = async (id: string, signal: AbortSignal) => {
	const parameters = { id };
	const options = { signal };
	const metadataPromise = getFont(parameters, options);
	const variablePromise = metadataPromise.then((metadata) =>
		metadata.variable
			? getVariableFont(parameters, options).catch(() => undefined)
			: undefined,
	);
	const registryPromise = loadOptionalRegistryData(
		getRegistryFamily(parameters, options),
		signal,
	);
	const [metadata, variable, registryResult] = await Promise.all([
		metadataPromise,
		variablePromise,
		registryPromise,
	]);

	return {
		metadata,
		variable,
		registry: registryResult.value,
		registryState: registryResult.state,
		...getFontPreviewCSS(metadata, variable),
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
	if (base.registryState !== 'available') {
		return {
			capabilitySource: undefined,
			capabilities: undefined,
			state: base.registryState,
		};
	}
	const capabilitySource = base.registry?.sources.find(
		(source) => source.sha256 === base.registry?.previewSource,
	);

	if (!capabilitySource) {
		return {
			capabilitySource,
			capabilities: undefined,
			state: 'not-found' as const,
		};
	}

	const result = await loadOptionalRegistryData(
		getRegistrySourceCapabilities(
			{ sha256: capabilitySource.sha256 },
			{ signal },
		),
		signal,
	);
	return {
		capabilitySource,
		capabilities: result.value,
		state: result.state,
	};
};

const loadFontPageLanguages = async (
	basePromise: Promise<FontPageBase>,
	signal: AbortSignal,
	scope: LanguageScope = 'family',
) => {
	const [base, result] = await Promise.all([
		basePromise,
		loadOptionalRegistryData(listRegistryLanguages({ signal }), signal),
	]);
	const state =
		base.registryState === 'available' ? result.state : base.registryState;
	return {
		languages:
			state === 'available'
				? scope === 'all'
					? result.value
					: selectRegistryFamilyLanguages(base.registry, result.value)
				: undefined,
		state,
	};
};

const loadFontPageSymbols = async (
	basePromise: Promise<FontPageBase>,
	signal: AbortSignal,
) => {
	const base = await basePromise;
	if (!base.registry?.symbols) {
		return { symbols: undefined, state: 'not-found' as const };
	}

	const result = await loadOptionalRegistryData(
		getRegistryFamilySymbols({ id: base.metadata.id }, { signal }),
		signal,
	);
	return { symbols: result.value, state: result.state };
};

export {
	loadFontPageBase,
	loadFontPageCapabilities,
	loadFontPageLanguages,
	loadFontPageStats,
	loadFontPageSymbols,
};
