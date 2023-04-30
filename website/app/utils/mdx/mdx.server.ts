import * as fs from 'fs/promises';
import * as path from 'pathe';
import remarkAutolinkHeadings from 'remark-autolink-headings';
import remarkGfm from 'remark-gfm';
import remarkSlug from 'remark-slug';

import { serialise } from './esbuild.server';

const globals = {};

const getSource = async (slug: string) => {
	const filepath = path.join(__dirname, '../docs', slug + '.mdx');
	return await fs.readFile(filepath, 'utf8');
};

const fetchMdx = async (slug: string) => {
	const source = await getSource(slug);
	const { code, frontmatter } = await serialise(source);

	return { code, frontmatter, globals };
};

export { fetchMdx };
