import { atom } from 'jotai';
import { atomWithReset } from 'jotai/utils';

const languageAtom = atom('Latin');
const sizeAtom = atom(32);
const italicAtom = atom(false);
const lineHeightAtom = atom(2);
const letterSpacingAtom = atom(2);
const transparencyAtom = atom(100);

const COLOR_REGEX = /^#[a-fA-F0-9]{0,6}$/;
const colorBaseAtom = atom('#000000');
const colorAtom = atom(
	(get) => get(colorBaseAtom),
	(_, set, color: string) => {
		if (COLOR_REGEX.test(color)) set(colorBaseAtom, color);
	}
);

// Generate font-variation-settings string from axes object e.g. "wght" 400, "wdth" 100
const createFontVariation = (axes: Record<string, number | undefined>) => {
	let fontVariation = '';
	for (const [key, value] of Object.entries(axes)) {
		if (value !== undefined) fontVariation += `"${key}" ${value}, `;
	}
	// Remove trailing comma and space
	return fontVariation.slice(0, -2);
};

const variableAtom = atomWithReset<Record<string, number | undefined>>({});
const variationAtom = atom(
	(get) => createFontVariation(get(variableAtom)),
	(get, set, axes: Record<string, number | undefined>) => {
		if (Object.keys(axes).length === 0) {
			set(variableAtom, {});
		} else {
			set(variableAtom, { ...get(variableAtom), ...axes });
		}
	}
);

export {
	colorAtom,
	italicAtom,
	languageAtom,
	letterSpacingAtom,
	lineHeightAtom,
	sizeAtom,
	transparencyAtom,
	variableAtom,
	variationAtom,
};
