import { observer, useValue } from '@legendapp/state/react';
import { useDebouncedValue } from '@mantine/hooks';
import { useMemo } from 'react';
import { Link } from 'react-router';

import { findUnmappedCharacters, usesNameLigatures } from '@/utils/registry';

import classes from './FamilyPreview.module.css';
import { usePreviewEditor } from './FamilyPreviewContext';
import { getActiveCapabilities } from './FamilyPreviewState';

const visibleItemLimit = 6;
const visibleNameLength = 32;

const truncateName = (value: string) => {
	const characters = Array.from(value);
	return characters.length > visibleNameLength
		? `${characters.slice(0, visibleNameLength - 1).join('')}…`
		: value;
};

const formatUnsupportedCharacters = (characters: string[]) =>
	characters
		.slice(0, visibleItemLimit)
		.map((character) =>
			/^\p{M}+$/u.test(character) ? `◌${character}` : character,
		)
		.join(' ');

const PreviewCoverage = observer(() => {
	const model = usePreviewEditor();
	const mode = useValue(model.state$.mode);
	const activeText = useValue(model.state$.texts[mode]);
	const capabilities = useValue(() => getActiveCapabilities(model));
	const [text] = useDebouncedValue(activeText, 300);
	const catalogNames = useMemo(
		() => new Set(model.symbols?.map((symbol) => symbol.name) ?? []),
		[model.symbols],
	);
	const checksSymbolNames = usesNameLigatures(model.registry);

	if (!text.trim()) return null;

	let message: string;
	let unsupported = false;

	if (checksSymbolNames) {
		if (catalogNames.size === 0) return null;
		const names = Array.from(new Set(text.trim().split(/\s+/u)));
		const unknownNames = names.filter((name) => !catalogNames.has(name));
		unsupported = unknownNames.length > 0;
		message = unsupported
			? `${unknownNames.length.toLocaleString('en')} ${unknownNames.length === 1 ? 'symbol name is' : 'symbol names are'} unavailable: ${unknownNames
					.slice(0, visibleItemLimit)
					.map(truncateName)
					.join(', ')}${unknownNames.length > visibleItemLimit ? ', …' : ''}.`
			: names.length === 1
				? 'This symbol name is available.'
				: 'All entered symbol names are available.';
	} else {
		if (!capabilities) return null;
		const unmapped = findUnmappedCharacters(text, capabilities);
		unsupported = unmapped.length > 0;
		message = unsupported
			? `${unmapped.length.toLocaleString('en')} ${unmapped.length === 1 ? 'character is' : 'characters are'} unavailable in this preview style: ${formatUnsupportedCharacters(unmapped)}${unmapped.length > visibleItemLimit ? ' …' : ''}.`
			: 'Every character in this preview is supported.';
	}

	return (
		<div
			className={classes.coverageStatus}
			data-unsupported={unsupported || undefined}
			role="status"
			aria-atomic="true"
		>
			<p>
				<strong>Coverage</strong>
				<span>{message}</span>
			</p>
			{unsupported && (
				<Link to={`/fonts/${model.metadata.id}/glyphs`}>
					{model.familyKind === 'symbols' ? 'Browse symbols' : 'Browse glyphs'}
				</Link>
			)}
		</div>
	);
});

export { PreviewCoverage };
