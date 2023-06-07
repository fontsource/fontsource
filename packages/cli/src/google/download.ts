import fs from 'fs-extra';
import type { FontVariants, FontVariantsVariable } from 'google-font-metadata';
import {
	APIIconStatic,
	APIIconVariable,
	APIv1,
	APIv2,
	APIVariable,
} from 'google-font-metadata';
import PQueue from 'p-queue';
import * as path from 'pathe';

import { type BuildOptions } from '../types';
import {
	assertNever,
	makeFontDownloadPath,
	makeVariableFontDownloadPath,
} from '../utils';

const writeDownload = async (url: string, dest: fs.PathLike) => {
	const res = await fetch(url);
	await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
};

interface StaticVariant {
	kind: 'static';
	weight: number;
	style: string;
	subset: string;
	url: string;
	extension: 'woff' | 'woff2' | 'ttf' | 'otf';
}

interface VariableVariant {
	kind: 'variable';
	axes: string;
	style: string;
	subset: string;
	url: string;
	extension: 'woff2';
}

type Variant = StaticVariant | VariableVariant;

const isAbsoluteURL = (url: string): boolean => {
	return /^https?:\/\//.test(url);
};

const getStaticVariantList = (
	variants: FontVariants,
	ttf?: boolean
): StaticVariant[] => {
	const variantList: StaticVariant[] = [];
	for (const [weight, styles] of Object.entries(variants)) {
		for (const [style, subsets] of Object.entries(styles)) {
			for (const [subset, { url }] of Object.entries(subsets)) {
				const props = {
					kind: 'static' as const,
					weight: Number(weight),
					style,
					subset: subset.replace('[', '').replace(']', ''),
				};
				if (isAbsoluteURL(url.woff2)) {
					variantList.push({
						...props,
						url: url.woff2,
						extension: 'woff2',
					});
				}
				if (isAbsoluteURL(url.woff)) {
					variantList.push({
						...props,
						url: url.woff,
						extension: 'woff',
					});
				}
				// Include TTF if requested
				if (ttf) {
					if (url.truetype && isAbsoluteURL(url.truetype)) {
						variantList.push({
							...props,
							url: url.truetype,
							extension: 'ttf',
						});
					}
					if (url.opentype && isAbsoluteURL(url.opentype)) {
						variantList.push({
							...props,
							url: url.opentype,
							extension: 'otf',
						});
					}
				}
			}
		}
	}
	return variantList;
};

const getVariableVariantList = (
	variants: FontVariantsVariable
): VariableVariant[] => {
	const variantList: VariableVariant[] = [];
	for (const [axes, styles] of Object.entries(variants)) {
		for (const [style, subsets] of Object.entries(styles)) {
			for (const [subset, url] of Object.entries(subsets)) {
				if (isAbsoluteURL(url)) {
					variantList.push({
						kind: 'variable',
						axes,
						style,
						subset: subset.replace('[', '').replace(']', ''),
						url,
						extension: 'woff2',
					});
				}
			}
		}
	}
	return variantList;
};

interface DownloadLinks {
	url: string;
	dest: string;
}

const getDownloadPath = (
	id: string,
	variant: Variant,
	opts: BuildOptions
): string => {
	if (variant.kind === 'static') {
		return makeFontDownloadPath(
			opts.dir,
			id,
			variant.subset,
			variant.weight,
			variant.style,
			variant.extension
		);
	}
	if (variant.kind === 'variable') {
		return makeVariableFontDownloadPath(
			opts.dir,
			id,
			variant.subset,
			variant.axes,
			variant.style
		);
	}
	return assertNever(variant);
};

const variantsToLinks = (
	id: string,
	variants: Variant[],
	opts: BuildOptions
): DownloadLinks[] => {
	// Map of destination paths to download URLs
	const linkMap = new Map<string, string>();

	// We add all variants to the map, later variants will overwrite equivalent earlier variants.
	// This is to ensure that we don't download the same file twice, and that we select V2 variants over V1 variants.
	for (const variant of variants) {
		linkMap.set(getDownloadPath(id, variant, opts), variant.url);
	}

	const links: DownloadLinks[] = [];

	for (const [dest, url] of linkMap.entries()) {
		links.push({ url, dest });
	}

	return links;
};

// Generates list of URLs and destinations for static fonts
const staticLinks = (id: string, opts: BuildOptions): DownloadLinks[] => {
	let variants: Variant[];

	if (opts.isIcon) {
		const font = APIIconStatic[id];
		variants = getStaticVariantList(font.variants, opts.ttf);
	} else {
		const fontV1 = APIv1[id];
		const fontV2 = APIv2[id];

		// V1 variants are only needed because sometimes V2 variants don't have
		// language subsets, but if noSubset is true, we can skip parsing them.
		const variantsV1 = opts.noSubset
			? []
			: getStaticVariantList(fontV1.variants, opts.ttf);
		const variantsV2 = getStaticVariantList(fontV2.variants, opts.ttf);

		// Order is important here, as we want V2 variants to overwrite V1 variants when deduplicating.
		variants = [...variantsV1, ...variantsV2];
	}

	return variantsToLinks(id, variants, opts);
};

const variableLinks = (id: string, opts: BuildOptions): DownloadLinks[] => {
	const font = opts.isIcon ? APIIconVariable[id] : APIVariable[id];
	const variants = getVariableVariantList(font.variants);
	return variantsToLinks(id, variants, opts);
};

const queue = new PQueue({ concurrency: 30 });

const download = async (id: string, opts: BuildOptions) => {
	await fs.ensureDir(path.join(opts.dir, 'files'));

	// Get download URLs of font files
	const links = opts.isVariable
		? variableLinks(id, opts)
		: staticLinks(id, opts);

	// Download all font files
	for (const link of links) {
		// eslint-disable-next-line @typescript-eslint/return-await
		void queue.add(async () => writeDownload(link.url, link.dest));
	}

	await queue.onIdle();
};

export {
	download,
	getStaticVariantList,
	getVariableVariantList,
	staticLinks,
	variableLinks,
};
