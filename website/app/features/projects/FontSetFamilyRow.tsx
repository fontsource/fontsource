import { Button } from '@mantine/core';
import { IconExternalLink, IconTrash } from '@tabler/icons-react';
import { Link } from 'react-router';

import { formatFontLabel } from '@/utils/font-labels';
import classes from './CurrentProjectPage.module.css';
import type { ResolvedFontSetFamily } from './model';
import { getCdnStylesheetUrl } from './output';

const FontSetFamilyRow = ({
	busy,
	item,
	onRemove,
}: {
	busy: boolean;
	item: ResolvedFontSetFamily;
	onRemove: () => void;
}) => {
	const useSpecimenFont =
		item.classification !== 'symbols' || Boolean(item.previewText);
	return (
		<article className={classes.fontRow}>
			{useSpecimenFont && (
				<link rel="stylesheet" href={getCdnStylesheetUrl(item)} />
			)}
			<div
				className={classes.specimen}
				style={
					useSpecimenFont
						? {
								fontFamily: `${JSON.stringify(item.fontFamily)}, var(--mantine-font-family)`,
							}
						: undefined
				}
			>
				{item.previewText ?? item.family}
			</div>
			<div className={classes.fontDetails}>
				<h2>
					<Link to={`/fonts/${item.familyId}`}>{item.family}</Link>
				</h2>
				<p>
					{item.designer ? `By ${item.designer} · ` : ''}
					{formatFontLabel(item.classification)}
				</p>
				<div className={classes.rowActions}>
					{item.license.url ? (
						<a href={item.license.url} target="_blank" rel="noreferrer">
							{item.license.id}
							<IconExternalLink aria-hidden size={14} />
						</a>
					) : (
						<Link to={`/fonts/${item.familyId}/about#license`}>
							View license
						</Link>
					)}
					<Link
						to={`/fonts/${item.familyId}/use?tab=web`}
						aria-label={`Developer setup for ${item.family}`}
					>
						Developer setup
					</Link>
					<Button
						variant="subtle"
						color="gray"
						disabled={busy}
						leftSection={<IconTrash aria-hidden size={16} />}
						aria-label={`Remove ${item.family} from font set`}
						onClick={onRemove}
					>
						Remove
					</Button>
				</div>
			</div>
		</article>
	);
};

export { FontSetFamilyRow };
