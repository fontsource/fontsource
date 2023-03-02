import { atom } from 'jotai';

const languageAtom = atom('Latin');
const sizeAtom = atom(32);
const italicAtom = atom(false);
const lineHeightAtom = atom(2);
const letterSpacingAtom = atom(2);
const colorAtom = atom('#000000');
const transparencyAtom = atom(100);

const variableAtom = atom({});

export {
	colorAtom,
	italicAtom,
	languageAtom,
	letterSpacingAtom,
	lineHeightAtom,
	sizeAtom,
	transparencyAtom,
	variableAtom,
};
