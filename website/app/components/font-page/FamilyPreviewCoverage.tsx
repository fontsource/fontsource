import { observer, useValue } from '@legendapp/state/react';
import { useDebouncedValue } from '@mantine/hooks';
import { IconAlertTriangle } from '@tabler/icons-react';
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

	let title: string;
	let message: string;

	if (checksSymbolNames) {
		if (catalogNames.size === 0) return null;
		const names = Array.from(new Set(text.trim().split(/\s+/u)));
		const unknownNames = names.filter((name) => !catalogNames.has(name));
		if (unknownNames.length === 0) return null;

		title = 'Some symbol names aren’t available';
		message = `${unknownNames.length.toLocaleString('en')} ${unknownNames.length === 1 ? 'name' : 'names'} in this preview: ${unknownNames
			.slice(0, visibleItemLimit)
			.map(truncateName)
			.join(', ')}${unknownNames.length > visibleItemLimit ? ', …' : ''}.`;
	} else {
		if (!capabilities) return null;
		const unmapped = findUnmappedCharacters(text, capabilities);
		if (unmapped.length === 0) return null;

		title = 'Some characters aren’t available';
		message = `${unmapped.length.toLocaleString('en')} ${unmapped.length === 1 ? 'character' : 'characters'} in this preview: ${formatUnsupportedCharacters(unmapped)}${unmapped.length > visibleItemLimit ? ' …' : ''}.`;
	}

	return (
		<div className={classes.coverageWarning} role="status" aria-atomic="true">
			<IconAlertTriangle aria-hidden="true" size={18} stroke={1.8} />
			<p>
				<strong>{title}</strong>
				<span>{message}</span>
			</p>
			<Link to={`/fonts/${model.metadata.id}/glyphs`}>
				{model.familyKind === 'symbols' ? 'Browse symbols' : 'Browse glyphs'}
			</Link>
		</div>
	);
});

export { PreviewCoverage };
