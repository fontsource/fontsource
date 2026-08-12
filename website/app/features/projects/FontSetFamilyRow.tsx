import { IconExternalLink, IconTrash } from '@tabler/icons-react';
import { Link } from 'react-router';

import { formatFontLabel } from '@/utils/font-labels';
import classes from './CurrentProjectPage.module.css';
import type { ResolvedFontSetFamily } from './model';
import { getCdnStylesheetUrl } from './output';

const FontSecondaryDetails = ({ item }: { item: ResolvedFontSetFamily }) => (
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
				{item.license.url ? (
					<a href={item.license.url} target="_blank" rel="noreferrer">
						{item.license.id}
						<IconExternalLink aria-hidden size={13} />
					</a>
				) : (
					<Link to={`/fonts/${item.familyId}/about#license`}>View license</Link>
				)}
			</dd>
		</div>
	</dl>
);

const FontSetFamilyRow = ({
	busy,
	item,
	onRemove,
}: {
	busy: boolean;
	item: ResolvedFontSetFamily;
	onRemove: () => void;
}) => {
	const previewFontFamily = `${JSON.stringify(item.fontFamily)}, var(--mantine-font-family)`;
	const previewText = item.previewText ?? item.family;
	const useSpecimenFont =
		item.classification !== 'symbols' || Boolean(item.previewText);

	return (
		<article className={classes.fontRow}>
			{useSpecimenFont && (
				<link rel="stylesheet" href={getCdnStylesheetUrl(item)} />
			)}
			<div
				className={classes.specimen}
				data-ui-fallback={!useSpecimenFont || undefined}
				style={useSpecimenFont ? { fontFamily: previewFontFamily } : undefined}
			>
				{previewText}
			</div>
			<div className={classes.fontDetails}>
				<div className={classes.fontTitle}>
					<div>
						<h2>
							<Link to={`/fonts/${item.familyId}`}>{item.family}</Link>
						</h2>
						<p className={classes.fontMeta}>
							{item.designer ? `By ${item.designer} · ` : ''}
							{formatFontLabel(item.classification)}
						</p>
					</div>
				</div>
				<div className={classes.desktopSecondary}>
					<FontSecondaryDetails item={item} />
				</div>
				<details className={classes.mobileSecondary}>
					<summary>More details</summary>
					<FontSecondaryDetails item={item} />
				</details>
				<div className={classes.rowActions}>
					<Link to={`/fonts/${item.familyId}/use?tab=web`}>
						View instructions
					</Link>
					<button
						type="button"
						disabled={busy}
						aria-label={`Remove ${item.family} from font set`}
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
