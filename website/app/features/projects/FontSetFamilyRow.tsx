import { IconExternalLink, IconTrash } from '@tabler/icons-react';
import { Link } from 'react-router';

import { formatFontLabel } from '@/utils/font-labels';
import classes from './CurrentProjectPage.module.css';
import type { ResolvedFontSetFamily } from './model';
import {
	getPreviewCdnUrl,
	getUsageNote,
	hasSymbolCatalog,
	isDigitalFamily,
	usesNameLigatures,
} from './output';

const FontSecondaryDetails = ({
	item,
	tags,
}: {
	item: ResolvedFontSetFamily;
	tags: string[];
}) => {
	const usageNote = item.registryFactsCurrent ? getUsageNote(item) : undefined;

	return (
		<>
			{tags.length > 0 && (
				<ul className={classes.tags}>
					{tags.map((tag) => (
						<li key={tag}>{formatFontLabel(tag)}</li>
					))}
				</ul>
			)}
			<dl className={classes.secondarySetup}>
				<div className={classes.mobileSource}>
					<dt>Source</dt>
					<dd>
						{item.designer ? `By ${item.designer} · ` : ''}
						{formatFontLabel(item.classification)}
					</dd>
				</div>
				<div>
					<dt>License</dt>
					<dd>
						{item.license.verified && item.license.url && item.license.id ? (
							<a href={item.license.url} target="_blank" rel="noreferrer">
								{item.license.id}
								<IconExternalLink aria-hidden size={13} />
							</a>
						) : (
							<Link to={`/fonts/${item.familyId}/about#license`}>
								Needs verification
							</Link>
						)}
					</dd>
				</div>
			</dl>
			{usageNote && <p className={classes.usageNote}>{usageNote}</p>}
		</>
	);
};

const FontSetFamilyRow = ({
	busy,
	item,
	onRemove,
}: {
	busy: boolean;
	item: ResolvedFontSetFamily;
	onRemove: () => void;
}) => {
	const variationSettings = Object.entries(item.axes)
		.map(([axis, value]) => `"${axis}" ${value}`)
		.join(', ');
	const tags = item.tags.slice(0, 2);
	const usesSpecializedSpecimen =
		hasSymbolCatalog(item) ||
		isDigitalFamily(item) ||
		item.tags.includes('special-use/punctuation');
	const supportsLatin =
		item.subset === 'latin' || item.subset.startsWith('latin-');
	const isBarcodeFamily = item.tags.some((tag) => tag.includes('barcode'));
	const staleSpecializedSpecimen =
		!item.registryFactsCurrent && usesSpecializedSpecimen;
	const specimenText = staleSpecializedSpecimen
		? item.displayName
		: hasSymbolCatalog(item)
			? usesNameLigatures(item)
				? 'home settings favorite'
				: item.sampleText
			: isDigitalFamily(item) || isBarcodeFamily
				? '0123456789'
				: usesSpecializedSpecimen || !supportsLatin
					? item.sampleText
					: item.displayName;

	return (
		<article className={classes.fontRow}>
			<link rel="stylesheet" href={getPreviewCdnUrl(item)} />
			<div
				className={classes.specimen}
				data-ui-fallback={staleSpecializedSpecimen || undefined}
				data-compact={
					hasSymbolCatalog(item) ||
					isDigitalFamily(item) ||
					isBarcodeFamily ||
					undefined
				}
				style={{
					fontFamily: staleSpecializedSpecimen ? undefined : item.fontFamily,
					fontFeatureSettings:
						!staleSpecializedSpecimen && usesNameLigatures(item)
							? '"liga"'
							: undefined,
					fontVariationSettings: staleSpecializedSpecimen
						? undefined
						: variationSettings || undefined,
					fontWeight: staleSpecializedSpecimen ? undefined : item.weight,
					fontStyle: staleSpecializedSpecimen ? undefined : item.style,
				}}
			>
				{specimenText}
			</div>
			<div className={classes.fontDetails}>
				<div className={classes.fontTitle}>
					<div>
						<h2>
							<Link to={`/fonts/${item.familyId}`}>{item.displayName}</Link>
						</h2>
						<p className={classes.fontMeta}>
							{item.designer ? `By ${item.designer} · ` : ''}
							{formatFontLabel(item.classification)}
						</p>
					</div>
					{item.status === 'deprecated' && (
						<span className={classes.status}>Deprecated</span>
					)}
				</div>
				<div className={classes.desktopSecondary}>
					<FontSecondaryDetails item={item} tags={tags} />
				</div>
				<details className={classes.mobileSecondary}>
					<summary>More details</summary>
					<FontSecondaryDetails item={item} tags={tags} />
				</details>
				<div className={classes.rowActions}>
					<button
						type="button"
						disabled={busy}
						aria-label={`Remove ${item.displayName} from font set`}
						onClick={onRemove}
					>
						<IconTrash aria-hidden size={16} />
						Remove
					</button>
				</div>
			</div>
		</article>
	);
};

export { FontSetFamilyRow };
