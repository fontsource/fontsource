import {
	getFont,
	getRegistryFamily,
	getRegistrySourceCapabilities,
	getVariableFont,
	listRegistryLanguages,
} from '@/generated/api';
import { getFontPreviewCSS } from '@/utils/font-preview';
import { selectRegistryFamilyLanguages } from '@/utils/registry';

interface OptionalResult<T> {
	value?: T;
	unavailable: boolean;
}

const loadOptional = async <T>(
	request: Promise<T>,
): Promise<OptionalResult<T>> => {
	try {
		return { value: await request, unavailable: false };
	} catch {
		return { unavailable: true };
	}
};

const loadFontPageBase = async (id: string, signal: AbortSignal) => {
	const parameters = { id };
	const options = { signal };
	const metadataPromise = getFont(parameters, options);
	const variablePromise = metadataPromise.then((metadata) =>
		metadata.variable
			? getVariableFont(parameters, options).catch(() => undefined)
			: undefined,
	);
	const registryPromise = loadOptional(getRegistryFamily(parameters, options));
	const [metadata, variable, registryResult] = await Promise.all([
		metadataPromise,
		variablePromise,
		registryPromise,
	]);

	return {
		metadata,
		variable,
		registry: registryResult.value,
		registryUnavailable: registryResult.unavailable,
		...getFontPreviewCSS(metadata, variable),
	};
};

type FontPageBase = Awaited<ReturnType<typeof loadFontPageBase>>;

const loadFontPageCapabilities = async (
	basePromise: Promise<FontPageBase>,
	signal: AbortSignal,
) => {
	const base = await basePromise;
	const capabilitySource = base.registry?.sources.find(
		(source) => source.sha256 === base.registry?.previewSource,
	);

	if (!capabilitySource) {
		return { capabilitySource, capabilities: undefined, unavailable: false };
	}

	const result = await loadOptional(
		getRegistrySourceCapabilities(
			{ sha256: capabilitySource.sha256 },
			{ signal },
		),
	);
	return {
		capabilitySource,
		capabilities: result.value,
		unavailable: result.unavailable,
	};
};

const loadFontPageLanguages = async (
	basePromise: Promise<FontPageBase>,
	signal: AbortSignal,
) => {
	const [base, result] = await Promise.all([
		basePromise,
		loadOptional(listRegistryLanguages({ signal })),
	]);
	return {
		languages: selectRegistryFamilyLanguages(base.registry, result.value),
		unavailable: result.unavailable,
	};
};

export {
	loadFontPageBase,
	loadFontPageCapabilities,
	loadFontPageLanguages,
	loadOptional,
};
