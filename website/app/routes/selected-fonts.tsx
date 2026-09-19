import type { MetaFunction } from 'react-router';

import { CurrentProjectPage } from '@/features/projects/CurrentProjectPage';
import { ogMeta } from '@/utils/meta';

export const meta: MetaFunction = () =>
	ogMeta({
		title: 'Font Set | Fontsource',
		description:
			'Keep font families together, download them in one bundle, or generate a combined website starting point.',
	});

export default function SelectedFontsPage() {
	return <CurrentProjectPage />;
}
