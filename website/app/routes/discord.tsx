import type { LoaderFunction } from 'react-router';
import { redirect } from 'react-router';

export const loader: LoaderFunction = async () => {
	return redirect('https://discord.gg/pJgkn7xjAj', 301);
};
