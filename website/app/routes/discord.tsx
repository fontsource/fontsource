import type { LoaderFunction } from '@remix-run/cloudflare';
import { redirect } from '@remix-run/cloudflare';

export const loader: LoaderFunction = async () => {
	return redirect('https://discord.gg/pJgkn7xjAj', 301);
};
