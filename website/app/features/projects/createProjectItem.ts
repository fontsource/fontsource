import { selectVariableAxisKey } from '@fontsource-utils/core';

import type {
	GetFontResponse,
	GetFontVersionsResponse,
	GetVariableFontResponse,
} from '@/generated/api';
import { getPreferredPreviewSubset } from '@/utils/font-preview';
import type { RegistryFamily } from '@/utils/registry';

import type { ProjectItem } from './model';

interface CreateProjectItemOptions {
	metadata: GetFontResponse;
	versions: GetFontVersionsResponse;
	variable?: GetVariableFontResponse;
	registry?: RegistryFamily;
	format: 'variable' | 'static';
	subset: string;
	style: 'normal' | 'italic';
	weight: number;
	axes?: Record<string, number>;
	sampleText?: string;
}

type CreateDefaultProjectItemOptions = Pick<
	CreateProjectItemOptions,
	'metadata' | 'registry' | 'variable' | 'versions'
>;

const categoryClassifications: Record<
	GetFontResponse['category'],
	ProjectItem['classification']
> = {
	'sans-serif': 'sans-serif',
	serif: 'serif',
	display: 'display',
	handwriting: 'handwriting',
	monospace: 'monospace',
	icons: 'symbols',
	other: 'other',
};

const createProjectItem = ({
	metadata,
	versions,
	variable,
	registry,
	format,
	subset,
	style,
	weight,
	axes = {},
	sampleText,
}: CreateProjectItemOptions): ProjectItem => {
	const isVariable =
		format === 'variable' && Boolean(variable && versions.latestVariable);
	const hasCatalog = Boolean(registry?.symbols);
	const packageName = isVariable
		? `@fontsource-variable/${metadata.id}`
		: `@fontsource/${metadata.id}`;
	const iconUsesMultipleAxes =
		hasCatalog && isVariable && Object.keys(variable?.axes ?? {}).length > 1;
	const axisKey =
		isVariable && variable
			? selectVariableAxisKey(
					variable.axes,
					Object.keys(variable.axes),
				).toLowerCase()
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
		subset,
		style,
		weight,
		axes: isVariable ? { ...axes, wght: weight } : {},
		packageName,
		packageVersion: isVariable
			? (versions.latestVariable ?? versions.latest)
			: versions.latest,
		cssFile,
		fontFamily: isVariable ? `${metadata.family} Variable` : metadata.family,
		sampleText:
			sampleText?.trim() ||
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

const createDefaultProjectItem = ({
	metadata,
	versions,
	variable,
	registry,
}: CreateDefaultProjectItemOptions) => {
	const style = metadata.styles.includes('normal')
		? 'normal'
		: (metadata.styles[0] ?? 'normal');
	const weight = metadata.weights.includes(400)
		? 400
		: (metadata.weights[0] ?? 400);
	const useVariable = Boolean(variable && versions.latestVariable);
	const axes = useVariable
		? Object.fromEntries(
				Object.entries(variable?.axes ?? {})
					.filter(([axis]) => axis.toLowerCase() !== 'ital')
					.map(([axis, range]) => [axis, Number(range.default)]),
			)
		: {};

	return createProjectItem({
		metadata,
		versions,
		variable,
		registry,
		format: useVariable ? 'variable' : 'static',
		subset: getPreferredPreviewSubset(metadata, registry),
		style,
		weight,
		axes,
	});
};

export { createDefaultProjectItem, createProjectItem };
