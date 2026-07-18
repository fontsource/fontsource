import type { LoaderFunction } from 'react-router';
import { redirect } from 'react-router';

import { cacheHeaders } from '@/utils/cache';

export const loader: LoaderFunction = async () => {
	return redirect('https://status.fontsource.org', {
		status: 302,
		headers: cacheHeaders.short,
	});
};
