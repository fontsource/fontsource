import type { CSSProperties } from 'react';
import type { LanguageRegistration } from 'shiki/core';

import { fontsourceCodeTheme } from './theme';

const languageAliases: Record<string, string> = {
	bash: 'sh',
	js: 'javascript',
	shell: 'sh',
	ts: 'typescript',
	text: 'plaintext',
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

type LanguageDefinition = LanguageRegistration | LanguageRegistration[];

const languageLoaders = {
	css: async () => (await import('shiki/langs/css.mjs')).default,
	html: async () => (await import('shiki/langs/html.mjs')).default,
	javascript: async () => (await import('shiki/langs/javascript.mjs')).default,
	json: async () => (await import('shiki/langs/json.mjs')).default,
	jsx: async () => (await import('shiki/langs/jsx.mjs')).default,
	scss: async () => (await import('shiki/langs/scss.mjs')).default,
	sh: async () => (await import('shiki/langs/shellscript.mjs')).default,
	tsx: async () => (await import('shiki/langs/tsx.mjs')).default,
	typescript: async () => (await import('shiki/langs/typescript.mjs')).default,
} satisfies Record<string, () => Promise<LanguageDefinition>>;

type LoadedLanguage = keyof typeof languageLoaders | 'plaintext';

const resolveLanguage = (language?: string): LoadedLanguage => {
	const normalized = highlightLanguage(language ?? '');

	if (normalized === 'plaintext' || normalized in languageLoaders) {
		return normalized as LoadedLanguage;
	}

	return 'plaintext';
};

type ShikiToken = {
	content: string;
	offset?: number;
	color?: string;
	htmlStyle?: CSSProperties;
};

export type CodeToken = ShikiToken & {
	key: string;
};

export type CodeLine = {
	key: string;
	tokens: CodeToken[];
};

const loadHighlighter = async () => {
	const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] =
		await Promise.all([
			import('shiki/core'),
			import('shiki/engine/javascript'),
		]);

	return createHighlighterCore({
		engine: createJavaScriptRegexEngine(),
		langs: [],
		themes: [fontsourceCodeTheme],
	});
};

let highlighterPromise: ReturnType<typeof loadHighlighter> | undefined;

const loadedLanguages = new Set<LoadedLanguage>();
const languagePromises = new Map<LoadedLanguage, Promise<void>>();
const tokenCache = new Map<string, Promise<CodeLine[]>>();

const getHighlighter = () => {
	if (!highlighterPromise) {
		highlighterPromise = loadHighlighter();
	}

	return highlighterPromise;
};

const ensureLanguageLoaded = async (
	highlighter: Awaited<ReturnType<typeof loadHighlighter>>,
	lang: LoadedLanguage,
) => {
	if (lang === 'plaintext' || loadedLanguages.has(lang)) return;

	const pending = languagePromises.get(lang);
	if (pending) return pending;

	const promise = languageLoaders[lang]().then(async (language) => {
		await highlighter.loadLanguage(language);
		loadedLanguages.add(lang);
	});

	languagePromises.set(lang, promise);
	return promise;
};

const toCodeLines = (code: string, tokenLines: ShikiToken[][]): CodeLine[] => {
	let lineStart = 0;
	const sourceLines = code.split('\n');

	return tokenLines.map((tokens, sourceIndex) => {
		const sourceLine = sourceLines[sourceIndex] ?? '';
		const lineKey = `${lineStart}:${sourceLine}`;
		let fallbackOffset = lineStart;

		lineStart += sourceLine.length + 1;

		return {
			key: lineKey,
			tokens: tokens.map((token) => ({
				...token,
				key: String(token.offset ?? fallbackOffset++),
			})),
		};
	});
};

export const getHighlightedTokens = (code: string, language: string) => {
	const lang = resolveLanguage(language);
	const cacheKey = `${lang}:${code}`;
	const cached = tokenCache.get(cacheKey);

	if (cached) return cached;

	const promise = getHighlighter().then(async (highlighter) => {
		await ensureLanguageLoaded(highlighter, lang);

		const { tokens } = highlighter.codeToTokens(code, {
			lang,
			themes: {
				light: fontsourceCodeTheme.name,
				dark: fontsourceCodeTheme.name,
			},
		}) as { tokens: ShikiToken[][] };

		return toCodeLines(code, tokens);
	});

	tokenCache.set(cacheKey, promise);
	return promise;
};
