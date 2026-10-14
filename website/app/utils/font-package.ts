import type { FontFace, FontStyle } from '@fontsource-utils/core/css';
import type {
	GetFontResponse,
	GetPackageOutputResponse,
	GetVariableFontResponse,
} from '@/generated/api';

export type FontPageMetadata = Pick<
	GetFontResponse,
	| 'id'
	| 'family'
	| 'category'
	| 'weights'
	| 'defSubset'
	| 'variable'
	| 'version'
	| 'source'
	| 'lastModified'
> & { styles: FontStyle[] };

export type FontPackage = {
	version: string;
	metadata: FontPageMetadata;
	variable?: GetVariableFontResponse;
} & (
	| {
			manifest: Omit<GetPackageOutputResponse['manifest'], 'faces'> & {
				faces: FontFace[];
			};
			legacy?: never;
	  }
	| {
			manifest?: never;
			subsetDefinitions?: import('@/generated/api').GetRegistrySubsetResponse[];
			legacy: Omit<GetFontResponse, 'variants'>;
	  }
);
