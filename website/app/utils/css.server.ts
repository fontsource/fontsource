import ky from 'ky';

import { knex } from './db.server';
import type { DownloadMetadata } from './types';

const BASE_URL = 'https://cdn.jsdelivr.net/npm';

// Insert a weight array to find the closest number given num - used for index.css gen
const findClosest = (arr: number[], num: number): number => {
	// Array of absolute values showing diff from target number
	const indexArr = arr.map((weight) => Math.abs(Number(weight) - num));
	// Find smallest diff
	const min = Math.min(...indexArr);
	const closest = arr[indexArr.indexOf(min)];

	return closest;
};

// const STANDARD_AXES = ['opsz', 'slnt', 'wdth', 'wght'] as const;

const addCss = async (metadata: DownloadMetadata) => {
	// Add general CSS
	const { fontId, weights, styles, variable } = metadata;
	for (const weight of weights) {
		for (const style of styles) {
			let url;
			if (style === 'italic') {
				url = `${BASE_URL}/@fontsource/${fontId}/${weight}-italic.css`;
			} else {
				url = `${BASE_URL}/@fontsource/${fontId}/${weight}.css`;
			}

			const css = await ky(url).text();
			await knex('css')
				.insert({
					id: fontId,
					weight: String(weight),
					css,
					isItalic: style === 'italic',
					isVariable: false,
					isIndex: false,
				})
				.onConflict(['id', 'weight', 'isItalic', 'isVariable'])
				.merge();
		}
	}

	// Add index CSS
	const indexCss = await ky(
		`${BASE_URL}/@fontsource/${fontId}/index.css`
	).text();
	await knex('css')
		.insert({
			id: fontId,
			weight: String(findClosest(weights, 400)),
			css: indexCss,
			isItalic: false,
			isVariable: false,
			isIndex: true,
		})
		.onConflict(['id', 'weight', 'isItalic', 'isVariable'])
		.merge();

	// Add variable CSS
	if (variable) {
		const keys = Object.keys(variable);
		let css;
		/* Not used until v5 is released
        if (keys.length === 1 && keys.includes('wght')) {
            css = await fetch(`${BASE_URL}/@fontsource/${fontId}/variable.css`).then((res) => res.text());
            // If it includes any non-standard axes, skip
        } else if (!keys.some((key) => !STANDARD_AXES.includes(key as any))) {
            css = await fetch(`${BASE_URL}/@fontsource/${fontId}/variable-standard.css`).then((res) => res.text());
        } else {
            css = await fetch(`${BASE_URL}/@fontsource/${fontId}/variable-full.css`).then((res) => res.text());
        } */

		if (keys.length === 1 && keys.includes('wght')) {
			css = await ky(`${BASE_URL}/@fontsource/${fontId}/variable.css`).text();
		} else {
			css = await ky(
				`${BASE_URL}/@fontsource/${fontId}/variable-full.css`
			).text();
		}

		const wght = variable.wght;
		await knex('css')
			.insert({
				id: fontId,
				weight: wght ? `${wght.min}-${wght.max}` : '400',
				css,
				isItalic: false,
				isVariable: true,
				isIndex: false,
			})
			.onConflict(['id', 'weight', 'isItalic', 'isVariable'])
			.merge();

		// If it has italic variant
		if ('ital' in variable) {
			if (keys.length === 1 && keys.includes('wght')) {
				css = await ky(
					`${BASE_URL}/@fontsource/${fontId}/variable-italic.css`
				).text();
			} else {
				css = await ky(
					`${BASE_URL}/@fontsource/${fontId}/variable-full-italic.css`
				).text();
			}
			await knex('css')
				.insert({
					id: fontId,
					weight: wght ? `${wght.min}-${wght.max}` : '400',
					css,
					isItalic: true,
					isVariable: true,
					isIndex: false,
				})
				.onConflict(['id', 'weight', 'isItalic', 'isVariable'])
				.merge();
		}
	}
};

export { addCss };
