import { selectVariableAxisKey } from '@fontsource-utils/core';

import type {
	GetFontResponse,
	GetFontVersionsResponse,
	GetVariableFontResponse,
} from '@/generated/api';
import { getPreferredPreviewSubset } from '@/utils/font-preview';
import type { RegistryFamily } from '@/utils/registry';

import type { ResolvedFontSetFamily } from './model';

interface ResolveFontSetFamilyOptions {
	metadata: GetFontResponse;
	versions: GetFontVersionsResponse;
	variable?: GetVariableFontResponse;
	registry?: RegistryFamily;
}

const categoryClassifications: Record<
	GetFontResponse['category'],
	ResolvedFontSetFamily['classification']
> = {
	'sans-serif': 'sans-serif',
	serif: 'serif',
	display: 'display',
	handwriting: 'handwriting',
	monospace: 'monospace',
	icons: 'symbols',
	other: 'other',
};

const resolveFontSetFamily = ({
	metadata,
	versions,
	variable,
	registry,
}: ResolveFontSetFamilyOptions): ResolvedFontSetFamily => {
	const style = metadata.styles.includes('normal')
		? 'normal'
		: (metadata.styles[0] ?? 'normal');
	const weight = metadata.weights.includes(400)
		? 400
		: (metadata.weights[0] ?? 400);
	const isVariable = Boolean(variable && versions.latestVariable);
	const weightAxis = variable?.axes.wght;
	const axes: Record<string, number> =
		isVariable && weightAxis ? { wght: Number(weightAxis.default) } : {};
	const packageName = isVariable
		? `@fontsource-variable/${metadata.id}`
		: `@fontsource/${metadata.id}`;
	const hasCatalog = Boolean(registry?.symbols);
	const iconUsesMultipleAxes =
		hasCatalog && isVariable && Object.keys(variable?.axes ?? {}).length > 1;
	const axisKey =
		isVariable && variable
			? selectVariableAxisKey(variable.axes, Object.keys(axes)).toLowerCase()
			: 'wght';
	const styleSuffix = style === 'italic' ? '-italic' : '';
	const cssFile = iconUsesMultipleAxes
		? 'full.css'
		: isVariable
			? `${axisKey}${styleSuffix}.css`
			: `${weight}${styleSuffix}.css`;

	return {
		familyId: metadata.id,
		family: metadata.family,
		displayName: registry?.displayName ?? metadata.family,
		category: metadata.category,
		classification:
			registry?.classifications[0] ??
			categoryClassifications[metadata.category],
		tags: registry?.tags ?? [],
		designer: registry?.designer,
		status: registry?.status ?? 'active',
		registryFactsCurrent: Boolean(registry),
		variableAvailable: metadata.variable,
		defaultSubset: metadata.defSubset,
		format: isVariable ? 'variable' : 'static',
		subset: getPreferredPreviewSubset(metadata, registry),
		style,
		weight,
		axes,
		packageName,
		packageVersion: isVariable
			? (versions.latestVariable ?? versions.latest)
			: versions.latest,
		cssFile,
		fontFamily: isVariable ? `${metadata.family} Variable` : metadata.family,
		sampleText:
			registry?.sampleText?.short.trim() ||
			registry?.sampleText?.long?.trim() ||
			metadata.family,
		symbolInputModes: registry?.symbols?.inputModes ?? [],
		license: registry
			? {
					verified: true,
					id: registry.license.id,
					url: registry.license.url,
					attribution: registry.license.attribution,
				}
			: { verified: false },
	};
};

export { resolveFontSetFamily };
