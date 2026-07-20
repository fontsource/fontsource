import type { MetaFunction } from 'react-router';
import { FontWorkbench } from '@/components/tools/FontWorkbench';
import { ogMeta } from '@/utils/meta';

export const meta: MetaFunction = () =>
	ogMeta({
		title: 'Free Webfont Optimizer - WOFF2 & CSS | Fontsource',
		description:
			'Optimize TTF, OTF, WOFF, and WOFF2 fonts into compressed WOFF2 files with ready-to-use CSS. Free, private, and processed entirely in your browser.',
	});

export default function OptimizerPage() {
	return <FontWorkbench preset="optimizer" />;
}
