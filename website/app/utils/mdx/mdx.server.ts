import * as fs from 'fs/promises';
import * as path from 'pathe';

import { knex } from '@/utils/db.server';
import { ensurePrimary } from '@/utils/fly.server';
import { getAllSlugsInDir } from '@/utils/utils.server';

import type { Globals, SerialiseOutput } from './esbuild.server';
import { serialise } from './esbuild.server';

// We need to add the globals to the esbuild config so that it doesn't try to bundle them.
const globals: Globals = {
	react: 'React',
	'react-dom': 'ReactDOM',
};

process.env.NODE_ENV === 'production'
	? Object.assign(globals, {
			'react/jsx-runtime': '_jsx_runtime',
	  })
	: Object.assign(globals, {
			'react/jsx-dev-runtime': '_jsx_runtime',
	  });

const getSource = async (slug: string) => {
	const filepath = path.join(__dirname, '../docs', slug + '.mdx');
	try {
		return await fs.readFile(filepath, 'utf8');
	} catch {
		return null;
	}
};

interface MdxResult extends SerialiseOutput {
	globals: Globals;
}

const fetchMdx = async (slug: string): Promise<MdxResult | null> => {
	const result = await knex('docs').where({ route: slug }).first();
	if (result) {
		return {
			code: result.content,
			frontmatter: {
				description: result.description,
				title: result.title,
				section: result.section,
			},
			globals,
		};
	}

	// If the doc doesn't exist in the db, we need to create it.
	await ensurePrimary();
	const source = await getSource(slug);
	if (!source) return null;

	const { code, frontmatter } = await serialise(source, globals);

	await knex('docs')
		.insert({
			route: slug,
			content: code,
			title: frontmatter.title,
			description: frontmatter.description,
			section: frontmatter.section,
		})
		.onConflict('route')
		.merge();

	return { code, frontmatter, globals };
};

const populateDocsCache = async () => {
	await ensurePrimary();

	// Get all mdx files in nested directories in the docs folder
	const slugs = await getAllSlugsInDir(path.join(__dirname, '../docs'));

	// Run fetchMdx for each slug to put it in the db cache
	for (const slug of slugs) {
		await fetchMdx(slug);
	}
};

const resetDocsCache = async () => {
	await ensurePrimary();
	await knex('docs').del();
};

export { fetchMdx, populateDocsCache, resetDocsCache };
