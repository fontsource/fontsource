import type { LoaderFunction } from 'react-router';
import { redirect } from 'react-router';

import { cacheHeaders } from '@/utils/cache';

export const loader: LoaderFunction = async () => {
	return redirect('https://discord.gg/pJgkn7xjAj', {
		status: 301,
		headers: cacheHeaders.stable,
	});
};
