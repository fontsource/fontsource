import type { ResolvedFontSetFamily } from './model';

const getCdnStylesheetUrl = (item: ResolvedFontSetFamily) =>
	`https://cdn.jsdelivr.net/npm/${item.packageName}@${item.packageVersion}/index.css`;

export { getCdnStylesheetUrl };
