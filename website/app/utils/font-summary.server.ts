import { type MarkdownToJSX, parser, RuleType } from 'markdown-to-jsx/markdown';
import type { GetFontResponse } from '@/generated/api';

const sentences = new Intl.Segmenter('en', { granularity: 'sentence' });
const summaryLength = 140;

const paragraphText = (nodes: MarkdownToJSX.ASTNode[]): string =>
	nodes
		.map((node) => {
			switch (node.type) {
				case RuleType.text:
				case RuleType.codeInline:
					return node.text;
				case RuleType.textFormatted:
				case RuleType.link:
					return paragraphText(node.children);
				case RuleType.breakLine:
					return ' ';
				default:
					return '';
			}
		})
		.join('');

export const getFontDescriptionSummary = (
	description?: string,
	maxLength = summaryLength,
) => {
	const paragraph = description
		? parser(description).find((node) => node.type === RuleType.paragraph)
		: undefined;
	const text = paragraph
		? paragraphText(paragraph.children).replace(/\s+/gu, ' ').trim()
		: '';
	const [firstSentence] = sentences.segment(text);
	const sentence = firstSentence?.segment.trim();
	if (sentence && sentence.length <= maxLength) {
		return /[.!?]$/u.test(sentence) ? sentence : `${sentence}.`;
	}
};

export const getFontSummary = (
	metadata: Pick<GetFontResponse, 'family' | 'category'>,
	description?: string,
	designer?: string,
) => {
	// Keep complete sentences; long upstream stories fall back to structured facts.
	const sentence = getFontDescriptionSummary(description);
	if (sentence) return sentence;

	const kind =
		metadata.category === 'icons'
			? 'an icon'
			: metadata.category === 'other'
				? 'a'
				: `a ${metadata.category}`;
	const fact = `${metadata.family} is ${kind} font`;
	const credit = designer?.trim();
	return credit && `${fact} by ${credit}.`.length <= summaryLength
		? `${fact} by ${credit}.`
		: `${fact}.`;
};
