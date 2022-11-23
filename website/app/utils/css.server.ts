import { HTTPError } from 'ky';

import { knex } from './db.server';
import { ensurePrimary } from './fly.server';
import { fetchMetadata } from './metadata.server';
import type { DownloadMetadata } from './types';
import { kya } from './utils.server';

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

const cssRewrite = (css: string, id: string) =>
	css.replace(
		/url\('\.\/(files\/.*?)'\)/g,
		// match "url('./files/${woffFileName}')", then replace with "url('${baseURL}/files/${woffFileName}')"
		`url('${BASE_URL}/@fontsource/${id}/$1')`
			.replace(/\/\*[\s\S]*?\*\/|[\r\n\t]+/g, '')
			// limit number of adjacent spaces to 1
			.replace(/ {2,}/g, ' ')
			// remove spaces around the following: ,:;{}
			.replace(/ ?([,:;{}]) ?/g, '$1')
			// remove last semicolon in block
			.replace(/;}/g, '}')
	);

// const STANDARD_AXES = ['opsz', 'slnt', 'wdth', 'wght'] as const;

const addCss = async (metadata: DownloadMetadata) => {
	await ensurePrimary();
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

			try {
				const css = cssRewrite(await kya(url, { text: true }), fontId);

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
			} catch (err) {
				// There is a rare instance where a font has 400, 400italic, 700 but no 700italic
				// If it is not 404 and not italic, then throw error. Otherwise suppress
				if (
					err instanceof HTTPError &&
					err.response.status !== 404 &&
					style !== 'italic'
				) {
					throw err;
				}
			}
		}
	}

	// Add index CSS
	try {
		const indexCss = cssRewrite(
			await kya(`${BASE_URL}/@fontsource/${fontId}/index.css`, { text: true }),
			fontId
		);

		await knex('css')
			.insert({
				id: fontId,
				weight: String(findClosest(weights, 400)), // A font may not have a default 400 weight
				css: indexCss,
				isItalic: false,
				isVariable: false,
				isIndex: true,
			})
			.onConflict(['id', 'weight', 'isItalic', 'isVariable'])
			.merge();
	} catch (err) {
		if (err instanceof HTTPError && err.response.status === 404) {
			// In the rare case a font has no index.css due to a bug upstream, we can just use a find closest value
			let css;
			let weight = findClosest(weights, 400);
			if (styles.length === 1 && styles.includes('italic')) {
				// If only italic, then use 400italic
				css = cssRewrite(
					await kya(`${BASE_URL}/@fontsource/${fontId}/${weight}-italic.css`, {
						text: true,
					}),
					fontId
				);
			} else {
				// Otherwise use 400
				css = cssRewrite(
					await kya(`${BASE_URL}/@fontsource/${fontId}/${weight}.css`, {
						text: true,
					}),
					fontId
				);
			}

			await knex('css')
				.insert({
					id: fontId,
					weight,
					css,
					isItalic: true,
					isVariable: false,
					isIndex: true,
				})
				.onConflict(['id', 'weight', 'isItalic', 'isVariable'])
				.merge();
		}
	}

	// Add variable CSS
	if (variable) {
		// Remove ital key to make other keys easier to check
		const keys = Object.keys(variable).filter(
			(item) => !['ital'].includes(item)
		);
		let css;

		if (keys.length === 1 && keys.includes('wght')) {
			css = await kya(`${BASE_URL}/@fontsource/${fontId}/variable.css`, {
				text: true,
			});
		} else {
			css = await kya(`${BASE_URL}/@fontsource/${fontId}/variable-full.css`, {
				text: true,
			});
		}

		css = cssRewrite(css, fontId);

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
				css = await kya(
					`${BASE_URL}/@fontsource/${fontId}/variable-italic.css`,
					{ text: true }
				);
			} else {
				css = await kya(
					`${BASE_URL}/@fontsource/${fontId}/variable-full-italic.css`,
					{ text: true }
				);
			}

			css = cssRewrite(css, fontId);

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

interface CssOptions {
	index?: boolean;
	variable?: boolean;
	italic?: boolean;
	weights?: number[] | false;
}

const getCss = async (id: string, opts: CssOptions) => {
	let css;
	if (opts.index) {
		css = await knex('css').select('css').where({ id, isIndex: true }).first();
		if (!css) {
			await fetchMetadata(id);
			css = await knex('css')
				.select('css')
				.where({ id, isIndex: true })
				.first();
		}
	}

	if (opts.variable) {
		css = await knex('css')
			.select('css')
			.where({ id, isVariable: true, isItalic: opts.italic })
			.first();
		if (!css) {
			await fetchMetadata(id);
			css = await knex('css')
				.select('css')
				.where({ id, isVariable: true, isItalic: opts.italic })
				.first();
		}
	}

	// Returns a weird object
	return css.css;
};

export { addCss, getCss };
