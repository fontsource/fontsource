import type { GetFontResponse } from '@/generated/api';

const summaryLength = 140;

export const getFontSummary = (
	metadata: Pick<GetFontResponse, 'family' | 'category'>,
	designer?: string,
) => {
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
