import {
	type CodeHighlightAdapter,
	stripShikiCodeBlocks,
} from '@mantine/code-highlight';
import { createHighlighterCoreSync } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import css from 'shiki/langs/css.mjs';
import html from 'shiki/langs/html.mjs';
import javascript from 'shiki/langs/javascript.mjs';
import json from 'shiki/langs/json.mjs';
import jsx from 'shiki/langs/jsx.mjs';
import scss from 'shiki/langs/scss.mjs';
import shellscript from 'shiki/langs/shellscript.mjs';
import tsx from 'shiki/langs/tsx.mjs';
import typescript from 'shiki/langs/typescript.mjs';

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

const highlighter = createHighlighterCoreSync({
	engine: createJavaScriptRegexEngine(),
	langs: [css, html, javascript, json, jsx, scss, shellscript, tsx, typescript],
	themes: [fontsourceCodeTheme],
});

export const codeHighlightAdapter: CodeHighlightAdapter = {
	getHighlighter:
		() =>
		({ code, language }) => ({
			highlightedCode: stripShikiCodeBlocks(
				highlighter.codeToHtml(code, {
					lang: highlightLanguage(language ?? 'plaintext'),
					theme: fontsourceCodeTheme.name,
				}),
			),
			isHighlighted: true,
		}),
};
