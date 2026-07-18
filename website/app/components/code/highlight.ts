import {
	type CodeHighlightAdapter,
	stripShikiCodeBlocks,
} from '@mantine/code-highlight';
import type { HighlighterCore, LanguageInput } from 'shiki/core';

import { fontsourceCodeTheme } from './theme';

const languageAliases: Record<string, string> = {
	js: 'javascript',
	ts: 'typescript',
	txt: 'plaintext',
};

const languageLabels: Record<string, string> = {
	javascript: 'js',
	plaintext: 'txt',
	typescript: 'ts',
};

export const displayLanguage = (language: string) =>
	languageLabels[language] ?? language;

export const highlightLanguage = (language: string) => {
	const normalized = language.trim().toLowerCase();

	return languageAliases[normalized] ?? normalized;
};

const highlighterLanguages = [
	() => import('shiki/langs/css.mjs'),
	() => import('shiki/langs/html.mjs'),
	() => import('shiki/langs/javascript.mjs'),
	() => import('shiki/langs/json.mjs'),
	() => import('shiki/langs/jsx.mjs'),
	() => import('shiki/langs/scss.mjs'),
	() => import('shiki/langs/shellscript.mjs'),
	() => import('shiki/langs/tsx.mjs'),
	() => import('shiki/langs/typescript.mjs'),
] satisfies LanguageInput[];

const createCodeHighlighter = async () => {
	const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] =
		await Promise.all([
			import('shiki/core'),
			import('shiki/engine/javascript'),
		]);

	return createHighlighterCore({
		engine: createJavaScriptRegexEngine(),
		langs: highlighterLanguages,
		themes: [fontsourceCodeTheme],
	});
};

let highlighterPromise: Promise<HighlighterCore> | undefined;

const loadHighlighter = () => {
	highlighterPromise ??= createCodeHighlighter();
	return highlighterPromise;
};

export const codeHighlightAdapter: CodeHighlightAdapter = {
	loadContext: loadHighlighter,
	getHighlighter:
		(highlighter) =>
		({ code, language }) => {
			if (!highlighter) return { highlightedCode: code, isHighlighted: false };

			return {
				highlightedCode: stripShikiCodeBlocks(
					highlighter.codeToHtml(code, {
						lang: highlightLanguage(language ?? 'plaintext'),
						theme: fontsourceCodeTheme.name,
					}),
				),
				isHighlighted: true,
			};
		},
};
