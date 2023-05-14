import { useFetcher } from '@remix-run/react';
import { useEffect } from 'react';

import { useIsFontLoaded } from './useIsFontLoaded';

type LoadType = 'index' | 'variable' | 'all';

export const useLoadFont = (
	id: string,
	family: string,
	type: LoadType,
	setLoading: React.Dispatch<React.SetStateAction<boolean>>,
	weights?: number[]
) => {
	const fontCss = useFetcher();
	// useFetcher only knows when the CSS is loaded, but not the font files themselves
	const isFontLoaded = useIsFontLoaded(
		type === 'variable' ? `${family} Variable` : family,
		weights
	);

	useEffect(() => {
		if (fontCss.type === 'init') {
			let url = '';
			if (type === 'index') {
				url = `/fonts/${id}/fetch-css`;
			} else if (type === 'variable') {
				url = `/fonts/${id}/fetch-css/?variable=true&all=true`;
			} else if (type === 'all') {
				url = `/fonts/${id}/fetch-css/?all=true`;
			} else {
				throw new Error('Invalid load type');
			}
			fontCss.load(url);
		}

		if (fontCss.type === 'done') {
			const style = document.createElement('style');
			style.textContent = fontCss.data.css;
			document.head.appendChild(style);
		}

		if (fontCss.type === 'done' && isFontLoaded) {
			// Give browser time to load fonts in order to not cause a flash of unstyled font
			setLoading(false);
		}
	}, [fontCss, id, isFontLoaded, type, setLoading]);
};
