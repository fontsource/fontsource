import type {
	ListRegistryFamiliesResponse,
	ResolveFontPackagesResponse,
} from '@/generated/api';

import type { ResolvedFontSetFamily } from './model';

interface ResolveFontSetFamilyOptions {
	artifact: ResolveFontPackagesResponse['items'][number];
	registry: ListRegistryFamiliesResponse[number];
}

const resolveFontSetFamily = ({
	artifact,
	registry,
}: ResolveFontSetFamilyOptions): ResolvedFontSetFamily | undefined => {
	if (!registry.license) return;

	return {
		familyId: artifact.id,
		family: registry.displayName ?? registry.family,
		classification: registry.classifications[0],
		designer: registry.designer,
		packageName: artifact.packageName,
		packageVersion: artifact.packageVersion,
		fontFamily: artifact.fontFamily,
		previewText:
			registry.sampleText?.short.trim() || registry.sampleText?.long?.trim(),
		license: { id: registry.license.id, url: registry.license.url },
	};
};

export { resolveFontSetFamily };
