import type { LoaderFunction } from '@remix-run/cloudflare';
import { redirect } from '@remix-run/cloudflare';

export const loader: LoaderFunction = async () => {
	return redirect('/docs/getting-started/introduction');
};
