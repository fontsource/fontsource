import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import invariant from 'tiny-invariant';

import { getCss } from '@/utils/css.server';

export const loader: LoaderFunction = async ({ params }) => {
	invariant(params.id, 'Font ID is required');
	const css = await getCss(params.id, { index: true });

	return json({ css });
};
