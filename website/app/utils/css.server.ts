import { HTTPError } from 'ky';

import { knex } from '@/utils/db.server';
import { ensurePrimary } from '@/utils/fly.server';
import { updateAllMetadata } from '@/utils/metadata/metadata.server';
import type { DownloadMetadata, FontDirectory } from '@/utils/types';
import { isStandardAxesKey, kya } from '@/utils/utils.server';

const BASE_URL = (dir: FontDirectory) =>
	`https://cdn.jsdelivr.net/gh/fontsource/font-files@main/fonts/${dir}`;

// Insert a weight array to find the closest number given num - used for index.css gen
const findClosest = (arr: number[], num: number): number => {
	// Array of absolute values showing diff from target number
	const indexArr = arr.map((weight) => Math.abs(Number(weight) - num));
	// Find smallest diff
	const min = Math.min(...indexArr);
	const closest = arr[indexArr.indexOf(min)];

	return closest;
};

const cssRewrite = (css: string, id: string, dir: FontDirectory) =>
	css.replace(
		/url\(\.\/(files\/.*?)\)/g,
		// match "url(./files/${woffFileName})", then replace with "url(${baseURL}/files/${woffFileName})"
		`url('${BASE_URL(dir)}/${id}/$1')`
			.replace(/\/\*[\s\S]*?\*\/|[\r\n\t]+/g, '')
			// limit number of adjacent spaces to 1
			.replace(/ {2,}/g, ' ')
			// remove spaces around the following: ,:;{}
			.replace(/ ?([,:;{}]) ?/g, '$1')
			// remove last semicolon in block
			.replace(/;}/g, '}')
	);

const getFontDirectory = (
	metadata: DownloadMetadata,
	variable: boolean
): FontDirectory => {
	const { type, category } = metadata;
	if (type === 'google') {
		if (category === 'icons') {
			return variable ? 'variable-icons' : 'icons';
		}
		return variable ? 'variable' : 'google';
	}
	return 'other';
};

const addCss = async (metadata: DownloadMetadata) => {
	await ensurePrimary();
	// Add general CSS
	const { id, weights, styles, variable, type } = metadata;
	let fontDir = getFontDirectory(metadata, false);
	for (const weight of weights) {
		for (const style of styles) {
			let url;
			if (style === 'italic') {
				url = `${BASE_URL(fontDir)}/${id}/${weight}-italic.css`;
			} else {
				url = `${BASE_URL(fontDir)}/${id}/${weight}.css`;
			}

			try {
				const css = cssRewrite(await kya(url, { text: true }), id, fontDir);

				await knex('css')
					.insert({
						id,
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
			await kya(`${BASE_URL(fontDir)}/${id}/index.css`, {
				text: true,
			}),
			id,
			fontDir
		);

		await knex('css')
			.insert({
				id,
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
					await kya(`${BASE_URL(fontDir)}/${id}/${weight}-italic.css`, {
						text: true,
					}),
					id,
					fontDir
				);
			} else {
				// Otherwise use 400
				css = cssRewrite(
					await kya(`${BASE_URL(fontDir)}/${id}/${weight}.css`, {
						text: true,
					}),
					id,
					fontDir
				);
			}

			await knex('css')
				.insert({
					id,
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
		fontDir = getFontDirectory(metadata, true);

		// Remove ital key to make other keys easier to check
		const keys = Object.keys(variable).filter(
			(item) => !['ital'].includes(item)
		);
		let css;

		try {
			if (keys.length === 1 && keys.includes('wght')) {
				css = await kya(`${BASE_URL(fontDir)}/${id}/wght.css`, {
					text: true,
				});
			} else if (keys.length === 1) {
				// Some fonts have a single axis that is not wght
				css = await kya(
					`${BASE_URL(fontDir)}/${id}/${keys[0].toLowerCase()}.css`,
					{
						text: true,
					}
				);
			} else if (keys.every((key) => isStandardAxesKey(key))) {
				css = await kya(`${BASE_URL(fontDir)}/${id}/standard.css`, {
					text: true,
				});
			} else {
				css = await kya(`${BASE_URL(fontDir)}/${id}/full.css`, {
					text: true,
				});
			}
		} catch {
			// If all else fails, try index.css
			console.error(`Unable to retrieve variable CSS ${id}`);
			css = await kya(`${BASE_URL(fontDir)}/${id}/index.css`, {
				text: true,
			});
		}

		css = cssRewrite(css, id, fontDir);

		const wght = variable.wght;
		await knex('css')
			.insert({
				id,
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
			try {
				if (keys.length === 1 && keys.includes('wght')) {
					css = await kya(`${BASE_URL(fontDir)}/${id}/wght-italic.css`, {
						text: true,
					});
				} else if (keys.length === 1) {
					// Some fonts have a single axis that is not wght
					css = await kya(
						`${BASE_URL(fontDir)}/${id}/${keys[0].toLowerCase()}-italic.css`,
						{
							text: true,
						}
					);
				} else if (keys.every((key) => isStandardAxesKey(key))) {
					css = await kya(`${BASE_URL(fontDir)}/${id}/standard-italic.css`, {
						text: true,
					});
				} else {
					css = await kya(`${BASE_URL(fontDir)}/${id}/full-italic.css`, {
						text: true,
					});
				}
			} catch {
				// If all else fails, try index.css
				console.error(`Unable to retrieve italic variable CSS ${id}`);
				css = await kya(`${BASE_URL(fontDir)}/${id}/index.css`, {
					text: true,
				});
			}

			css = cssRewrite(css, id, fontDir);

			await knex('css')
				.insert({
					id,
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
	all?: boolean;
	index?: boolean;
	variable?: boolean;
}

const getIndexCss = async (id: string) => {
	const css = await knex('css')
		.select('css')
		.where({ id, isIndex: true })
		.first();
	return css.css;
};

const getAllCss = async (id: string, variable?: boolean) => {
	let css;
	if (variable) {
		css = await knex('css').select('css').where({ id, isVariable: true });
		css.push(
			await knex('css')
				.select('css')
				.where({ id, isVariable: true, isItalic: true })
		);
	} else {
		css = await knex('css').select('css').where({ id, isVariable: false });
		css.push(
			await knex('css')
				.select('css')
				.where({ id, isVariable: false, isItalic: true })
		);
	}
	if (css.length === 0) {
		throw new Error('No CSS found');
	}
	return css.map((item) => item.css).join('\n');
};

const getCss = async (id: string, opts: CssOptions): Promise<string> => {
	let css;
	if (opts.index) {
		try {
			css = await getIndexCss(id);
		} catch {
			// Maybe the font isn't in the db yet, try again
			await updateAllMetadata([id]);
			css = getIndexCss(id);
		}
		return css;
	}

	if (opts.all) {
		try {
			css = await getAllCss(id, opts.variable);
		} catch {
			await updateAllMetadata([id]);
			css = getAllCss(id, opts.variable);
		}
		return css;
	}

	throw new Error('Invalid options');
};

export { addCss, getCss };
