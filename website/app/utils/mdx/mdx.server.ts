import * as fs from 'fs/promises';
import * as path from 'pathe';

import { serialise } from './esbuild.server';

// We need to add the globals to the esbuild config so that it doesn't try to bundle them.
const globals: Record<string, string> = {
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

const fetchMdx = async (slug: string) => {
	const source = await getSource(slug);
	if (!source) return null;

	const { code, frontmatter } = await serialise(source, globals);
	return { code, frontmatter, globals };
};

export { fetchMdx };
