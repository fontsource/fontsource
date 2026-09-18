import type { RegistryFamily } from '@/utils/registry';

type FontPreview = Pick<
	RegistryFamily,
	'sampleText' | 'previewSubset' | 'previewContext'
>;

interface FontSummary extends FontPreview {
	id: string;
	family: string;
	defSubset: string;
	category: string;
	variable: boolean;
}

export type { FontPreview, FontSummary };
