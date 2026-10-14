import { generateCSS } from '@fontsource-utils/core/css';
import {
	getFont,
	getFontStats,
	getPackageOutput,
	getRegistryFamily,
	getRegistryFamilySymbols,
	getRegistrySourceCapabilities,
	getRegistrySubset,
	getVariableFont,
	listPublishedPackages,
	listRegistryLanguages,
} from '@/generated/api';
import { jsDelivrResolver } from '@/utils/cdn';
import type { FontPackage, FontPageMetadata } from '@/utils/font-package';
import { getFontPreviewCSS } from '@/utils/font-preview';
import {
	loadOptionalRegistryData,
	loadRequiredRegistryData,
} from '@/utils/registry-request.server';

const loadFontPageBase = async (id: string, signal: AbortSignal) => {
	const options = { signal };
	const [published, registry] = await Promise.all([
		listPublishedPackages(options),
		loadRequiredRegistryData(
			getRegistryFamily({ id }, options),
			signal,
			'Font registry record',
		),
	]);
	const versions = published[id];
	if (!versions) throw new Response('Font not found', { status: 404 });
	const loadPackage = async (
		kind: 'static' | 'variable',
		version?: string,
	): Promise<FontPackage | undefined> => {
		if (!version) return;
		if (Number(version.split('.')[0]) < 6) {
			const { variants: _variants, ...legacy } = await getFont({ id }, options);
			const variable =
				kind === 'variable'
					? await getVariableFont({ id }, options)
					: undefined;
			const characters = registry.distribution.characters;
			const subsetDefinitions =
				characters.type === 'subsets' &&
				characters.slicing &&
				characters.slicingSubset
					? [
							{
								...(await getRegistrySubset(
									{ id: characters.slicing },
									options,
								)),
								id: characters.slicingSubset,
							},
						]
					: [];
			return { version, legacy, metadata: legacy, variable, subsetDefinitions };
		}
		const output = await getPackageOutput({ id, kind, version }, options);
		const family = output.metadata;
		// OpenAPI renders template-literal font styles as string; API validates this schema.
		const manifest = output.manifest as NonNullable<FontPackage['manifest']>;
		const faces = manifest.faces;
		const source = family.sources.find(
			(source) => source.sha256 === family.distribution.variable?.[0]?.source,
		);
		const variable =
			kind === 'variable' && source?.type === 'variable'
				? {
						family: family.family,
						axes: Object.fromEntries(
							source.axes
								.filter((axis) => axis.tag !== 'ital')
								.map((axis) => [
									axis.tag,
									{
										min: String(axis.min),
										max: String(axis.max),
										default: String(axis.default),
										step: '1',
									},
								]),
						),
					}
				: undefined;
		const category =
			family.classifications.find(
				(
					value,
				): value is Exclude<FontPageMetadata['category'], 'icons' | 'other'> =>
					[
						'sans-serif',
						'serif',
						'display',
						'handwriting',
						'monospace',
					].includes(value),
			) ??
			(family.symbols?.inputModes.includes('name-ligature')
				? 'icons'
				: 'other');
		return {
			version,
			manifest,
			variable,
			metadata: {
				id,
				family: family.family,
				category,
				weights: [
					...new Set(
						faces.flatMap((face) =>
							typeof face.weight === 'number'
								? [face.weight]
								: [
										Number(
											variable?.axes.wght?.default ?? face.weight.split(' ')[0],
										),
									],
						),
					),
				],
				styles: [...new Set(faces.map((face) => face.style))],
				defSubset:
					family.distribution.characters.type === 'subsets'
						? family.distribution.characters.defaultSubset
						: faces[0].subset,
				variable: Boolean(versions.variable),
				version,
				lastModified: family.sourceModified,
				source: family.project?.repository ?? '',
			},
		};
	};
	const [staticPackage, variablePackage] = await Promise.all([
		loadPackage('static', versions.static),
		loadPackage('variable', versions.variable),
	]);
	const selected = variablePackage ?? staticPackage;
	if (!selected) throw new Response('Font not found', { status: 404 });
	const manifest = selected.manifest;
	return {
		metadata: selected.metadata,
		variable: variablePackage?.variable,
		registry,
		packages: { static: staticPackage, variable: variablePackage },
		previewCSS: manifest
			? generateCSS(
					manifest.family,
					manifest.entrypoints['index.css'].map(
						(index) => manifest.faces[index],
					),
					{
						resolver: jsDelivrResolver(
							id,
							Boolean(variablePackage),
							selected.version,
						),
					},
				)
			: getFontPreviewCSS(selected.legacy, selected.variable, selected.version),
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
		listRegistryLanguages(undefined, { signal }),
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
