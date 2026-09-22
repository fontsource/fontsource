import {
	getFont,
	getFontStats,
	getRegistryFamily,
	getRegistryFamilySymbols,
	getRegistrySourceCapabilities,
	getVariableFont,
	listRegistryLanguages,
} from '@/generated/api';
import {
	loadOptionalRegistryData,
	loadRequiredRegistryData,
} from '@/utils/registry-request.server';

const loadFontPageBase = async (id: string, signal: AbortSignal) => {
	const parameters = { id };
	const options = { signal };
	const metadataPromise = getFont(parameters, options);
	const variablePromise = metadataPromise.then((metadata) =>
		metadata.variable ? getVariableFont(parameters, options) : undefined,
	);
	const registryPromise = loadRequiredRegistryData(
		getRegistryFamily(parameters, options),
		signal,
		'Font registry record',
	);
	const [metadata, variable, registry] = await Promise.all([
		metadataPromise,
		variablePromise,
		registryPromise,
	]);

	const { variants: _variants, ...pageMetadata } = metadata;
	return {
		metadata: pageMetadata,
		variable,
		registry,
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

const loadFontPageLanguages = (signal: AbortSignal) =>
	loadRequiredRegistryData(
		listRegistryLanguages({ signal }),
		signal,
		'Language data',
	);

const loadFontPageSymbols = async (
	basePromise: Promise<FontPageBase>,
	signal: AbortSignal,
) => {
	const base = await basePromise;
	if (!base.registry.symbols) return undefined;

	return loadOptionalRegistryData(
		getRegistryFamilySymbols({ id: base.metadata.id }, { signal }),
		signal,
		'Font symbol catalog',
	);
};

export {
	loadFontPageBase,
	loadFontPageCapabilities,
	loadFontPageLanguages,
	loadFontPageStats,
	loadFontPageSymbols,
};
