import * as fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import * as path from 'pathe';

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
	const filepath = path.join(
		path.dirname(fileURLToPath(import.meta.url)),
		'../../../docs',
		slug + '.mdx',
	);

	try {
		return await fs.readFile(filepath, 'utf8');
	} catch {
		// Return undefined
	}
};

interface MdxResult extends SerialiseOutput {
	globals: Globals;
}

const docsMap = new Map<string, MdxResult>();

const fetchMdx = async (slug: string): Promise<MdxResult | undefined> => {
	// If we're in production, we can just get the doc from the db cache.
	if (process.env.NODE_ENV === 'production') {
		const result = docsMap.get(slug);
		if (result) return result;
	}

	// If the doc doesn't exist in the db, we need to create it.
	const source = await getSource(slug);
	if (!source) return;

	const { code, frontmatter } = await serialise(source, globals);

	if (process.env.NODE_ENV === 'production') {
		docsMap.set(slug, { code, frontmatter, globals });
	}

	return { code, frontmatter, globals };
};

export { fetchMdx };
