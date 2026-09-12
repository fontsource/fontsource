import { getJsDelivrPackageUrl } from '@/utils/cdn';
import type { ResolvedFontSetFamily } from './model';

const getCdnStylesheetUrl = (item: ResolvedFontSetFamily) =>
	getJsDelivrPackageUrl(item.packageName, item.packageVersion, 'index.css');

const getFontSetUsageCSS = (items: ResolvedFontSetFamily[]) =>
	items
		.map(
			(item) =>
				`.font-${item.familyId} {\n  font-family: ${JSON.stringify(item.fontFamily)};\n}`,
		)
		.join('\n\n');

export { getCdnStylesheetUrl, getFontSetUsageCSS };
