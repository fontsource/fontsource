import type { MetaFunction } from 'react-router';

import { CurrentProjectPage } from '@/features/projects/CurrentProjectPage';
import { ogMeta } from '@/utils/meta';

export const meta: MetaFunction = () =>
	ogMeta({
		title: 'Font Set | Fontsource',
		description:
			'Keep configured fonts together and generate combined package, CDN, or CSS output.',
	});

export default function SelectedFontsPage() {
	return <CurrentProjectPage />;
}
