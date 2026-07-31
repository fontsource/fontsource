import { selectVariableAxisKey } from '@fontsource-utils/core';

import type {
	GetFontResponse,
	GetFontVersionsResponse,
	GetRegistryFamilyResponse,
	GetVariableFontResponse,
} from '@/generated/api';
import {
	isDigitalFontFamily,
	isIconFontFamily,
	isPunctuationFontFamily,
} from '@/utils/registry';

import type { ProjectItem } from './model';

interface CreateProjectItemOptions {
	metadata: GetFontResponse;
	versions: GetFontVersionsResponse;
	variable?: GetVariableFontResponse;
	registry?: GetRegistryFamilyResponse;
	format: 'variable' | 'static';
	subset: string;
	style: 'normal' | 'italic';
	weight: number;
	axes?: Record<string, number>;
	sampleText?: string;
}

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

const getSampleText = (
	metadata: GetFontResponse,
	registry?: GetRegistryFamilyResponse,
	sampleText?: string,
) => {
	if (sampleText?.trim()) return sampleText.trim();
	if (isIconFontFamily(metadata, registry)) {
		return 'home  search  favorite';
	}
	if (isDigitalFontFamily(metadata, registry)) {
		return '12:48:36';
	}
	if (isPunctuationFontFamily(metadata, registry)) {
		return '「ことば」を、心地よく。';
	}
	return registry?.sampleText?.tester?.trim() || metadata.family;
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
	const isIconFamily = isIconFontFamily(metadata, registry);
	const isDigitalFamily = isDigitalFontFamily(metadata, registry);
	const packageName = isVariable
		? `@fontsource-variable/${metadata.id}`
		: `@fontsource/${metadata.id}`;
	const iconUsesMultipleAxes =
		isIconFamily && isVariable && Object.keys(variable?.axes ?? {}).length > 1;
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
			? `${subset}-${axisKey}${styleSuffix}.css`
			: `${subset}-${weight}${styleSuffix}.css`;

	return {
		familyId: metadata.id,
		family: metadata.family,
		displayName: registry?.displayName ?? metadata.family,
		category: metadata.category,
		classification:
			registry?.classifications[0] ??
			(isDigitalFamily
				? 'display'
				: categoryClassifications[metadata.category]),
		tags: registry?.tags ?? [],
		designer: registry?.designer,
		status: registry?.status ?? 'active',
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
		sampleText: getSampleText(metadata, registry, sampleText),
		license: registry?.license
			? {
					verified: true,
					id: registry.license.id,
					url: registry.license.url,
					attribution: registry.license.attribution,
				}
			: { verified: false },
	};
};

export { createProjectItem };
