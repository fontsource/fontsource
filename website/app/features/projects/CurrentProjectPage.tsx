import { useValue } from '@legendapp/state/react';
import { Button, Group, Modal, Text } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { IconDownload, IconExternalLink, IconTrash } from '@tabler/icons-react';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';

import { CopyCodeBlock } from '@/components/code/CopyCodeBlock';
import { AddFontSetToCollectionMenu } from '@/features/collections/AddToCollectionMenu';
import { deserializeStoredChoice } from '@/utils/browser-storage';
import {
	getPackageManagerCommand,
	packageManagers,
	packageManagerValues,
} from '@/utils/docs/packageManagers';
import { triggerBlobDownload } from '@/utils/download';
import { formatFontLabel, getAxisLabel } from '@/utils/font-labels';
import type { FontSummary } from '@/utils/font-summary';

import classes from './CurrentProjectPage.module.css';
import { useCurrentProjectStore } from './CurrentProjectProvider';
import { createFontSetArchive, FontSetArchiveError } from './downloadFontSet';
import type { ProjectItem } from './model';
import {
	getCdnUrl,
	getProjectCdnUrls,
	getProjectCss,
	getProjectCssFiles,
	getProjectEditUrl,
	getUsageBlock,
	getUsageNote,
	hasSymbolCatalog,
	isDigitalFamily,
	usesNameLigatures,
} from './output';

type DeliveryMethod = 'package' | 'cdn';
type FontSetView = 'files' | 'website';
type CssDownloadState = 'idle' | 'success' | 'error';
type ZipDownloadState = 'idle' | 'preparing' | 'success' | 'error';

interface FontSetImportLocationState {
	fontSetImport?: {
		collectionName: string;
		addedCount: number;
		existingCount: number;
		failedCount: number;
	};
}

const FontSecondaryDetails = ({
	item,
	selectedSubsets,
	tags,
}: {
	item: ProjectItem;
	selectedSubsets: string[];
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
						{formatFontLabel(item.classification)} · Package{' '}
						{item.packageVersion}
					</dd>
				</div>
				<div>
					<dt>
						{hasSymbolCatalog(item) ? 'Package subset' : 'Character subset'}
					</dt>
					<dd>
						{hasSymbolCatalog(item)
							? `${formatFontLabel(item.subset)} ${usesNameLigatures(item) ? 'symbol ligatures' : 'symbols'}`
							: selectedSubsets.map(formatFontLabel).join(', ')}
					</dd>
				</div>
				{item.fontDisplay && (
					<div>
						<dt>Font display</dt>
						<dd>{formatFontLabel(item.fontDisplay)}</dd>
					</div>
				)}
				{item.formats?.length && (
					<div>
						<dt>Webfont formats</dt>
						<dd>
							{item.formats.map((format) => format.toUpperCase()).join(', ')}
						</dd>
					</div>
				)}
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

const ProjectFont = ({
	busy,
	item,
	onRemove,
}: {
	busy: boolean;
	item: ProjectItem;
	onRemove: () => void;
}) => {
	const variationSettings = Object.entries(item.axes)
		.map(([axis, value]) => `"${axis}" ${value}`)
		.join(', ');
	const tags = item.tags.slice(0, 2);
	const selectedStyles = item.styles ?? [item.style];
	const selectedWeights = item.weights ?? [item.weight];
	const selectedSubsets = item.subsets ?? [item.subset];
	const setupSelection =
		item.format === 'variable'
			? `${selectedStyles.map(formatFontLabel).join(' + ')} · ${item.activeAxes?.map(getAxisLabel).join(' + ') ?? 'Variable axes'}`
			: `${selectedStyles.map(formatFontLabel).join(' + ')} · weights ${selectedWeights.join(' + ')}`;
	const usesSpecializedSpecimen =
		hasSymbolCatalog(item) ||
		isDigitalFamily(item) ||
		item.tags.includes('special-use/punctuation');
	const supportsLatin = selectedSubsets.some(
		(subset) => subset === 'latin' || subset.startsWith('latin-'),
	);
	const staleSpecializedSpecimen =
		!item.registryFactsCurrent && usesSpecializedSpecimen;
	const specimenText = staleSpecializedSpecimen
		? item.displayName
		: hasSymbolCatalog(item)
			? usesNameLigatures(item)
				? 'home settings favorite'
				: item.sampleText
			: isDigitalFamily(item)
				? '0123456789'
				: usesSpecializedSpecimen || !supportsLatin
					? item.sampleText
					: item.displayName;

	return (
		<article className={classes.fontRow}>
			<link rel="stylesheet" href={getCdnUrl(item)} />
			<div
				className={classes.specimen}
				data-ui-fallback={staleSpecializedSpecimen || undefined}
				data-compact={
					hasSymbolCatalog(item) || isDigitalFamily(item) || undefined
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
						<h2>{item.displayName}</h2>
						<p className={classes.fontMeta}>
							{item.designer ? `By ${item.designer} · ` : ''}
							{formatFontLabel(item.classification)} · Package{' '}
							{item.packageVersion}
						</p>
					</div>
					{item.status === 'deprecated' && (
						<span className={classes.status}>Deprecated</span>
					)}
				</div>
				{!item.registryFactsCurrent && (
					<p className={classes.staleSetup}>
						<span>Saved setup needs refresh.</span>{' '}
						<Link to={getProjectEditUrl(item)}>Refresh setup</Link>
					</p>
				)}
				<dl className={classes.primarySetup}>
					<div>
						<dt>Font type</dt>
						<dd>{formatFontLabel(item.format)}</dd>
					</div>
					<div>
						<dt>Weight &amp; style</dt>
						<dd>{setupSelection}</dd>
					</div>
				</dl>
				<div className={classes.desktopSecondary}>
					<FontSecondaryDetails
						item={item}
						selectedSubsets={selectedSubsets}
						tags={tags}
					/>
				</div>
				<details className={classes.mobileSecondary}>
					<summary>More details</summary>
					<FontSecondaryDetails
						item={item}
						selectedSubsets={selectedSubsets}
						tags={tags}
					/>
				</details>
				<div className={classes.rowActions}>
					<Link
						to={getProjectEditUrl(item)}
						aria-label={`Edit ${item.displayName} setup`}
					>
						Edit setup
					</Link>
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

const CurrentProjectPage = () => {
	const store = useCurrentProjectStore();
	const location = useLocation();
	const navigate = useNavigate();
	const initialImportResult = (
		location.state as FontSetImportLocationState | null
	)?.fontSetImport;
	const [importResult] = useState(initialImportResult);
	const ready = useValue(store.ready$);
	const items = useValue(store.getItems);
	const [method, setMethod] = useLocalStorage<DeliveryMethod>({
		key: 'current-project-delivery',
		defaultValue: 'package',
		deserialize: (value) =>
			deserializeStoredChoice(value, ['package', 'cdn'] as const, 'package'),
	});
	const [view, setView] = useState<FontSetView>('files');
	const [packageManager, setPackageManager] = useLocalStorage({
		key: 'package-manager',
		defaultValue: 'pnpm',
		deserialize: (value) =>
			deserializeStoredChoice(value, packageManagerValues, 'pnpm'),
	});
	const [removedItem, setRemovedItem] = useState<ProjectItem>();
	const [clearConfirmationOpen, setClearConfirmationOpen] = useState(false);
	const [cssDownloadState, setCssDownloadState] =
		useState<CssDownloadState>('idle');
	const [zipDownloadState, setZipDownloadState] =
		useState<ZipDownloadState>('idle');
	const [zipProgress, setZipProgress] = useState(0);
	const [zipError, setZipError] = useState<string>();
	const zipAbortController = useRef<AbortController | undefined>(undefined);
	const singleItem = items.length === 1 ? items[0] : undefined;
	const zipBusy = zipDownloadState === 'preparing';
	const packageNames = items
		.map((item) => `${item.packageName}@${item.packageVersion}`)
		.join(' ');
	const collectionFonts: FontSummary[] = items.map((item) => ({
		id: item.familyId,
		family: item.family,
		defSubset: item.defaultSubset ?? item.subset,
		category: item.category,
		variable: item.variableAvailable ?? item.format === 'variable',
	}));
	const installCommand = getPackageManagerCommand(packageManager, packageNames);
	const imports = items
		.flatMap((item) =>
			item.packageFontFaceCSS
				? [item.packageFontFaceCSS]
				: getProjectCssFiles(item).map(
						(file) => `@import '${item.packageName}/${file}';`,
					),
		)
		.join('\n');
	const cdnLinks = items
		.flatMap((item) =>
			item.cdnFontFaceCSS
				? [item.cdnFontFaceCSS]
				: getProjectCdnUrls(item).map((url) => `@import url('${url}');`),
		)
		.join('\n');
	const usageCss = items.map((item) => getUsageBlock(item)).join('\n\n');
	const verifiedItems = items.filter((item) => item.license.verified);
	const unverifiedItems = items.filter((item) => !item.license.verified);
	const staleRegistryItems = items.filter((item) => !item.registryFactsCurrent);
	const licenseGroups = Object.entries(
		verifiedItems.reduce<Record<string, ProjectItem[]>>((groups, item) => {
			const id = item.license.id ?? 'Unknown license';
			const group = groups[id] ?? [];
			group.push(item);
			groups[id] = group;
			return groups;
		}, {}),
	).sort(([left], [right]) => left.localeCompare(right));

	const downloadCss = () => {
		try {
			triggerBlobDownload(
				'fontsource-font-set.css',
				new Blob([getProjectCss(items)], { type: 'text/css' }),
			);
			setCssDownloadState('success');
		} catch {
			setCssDownloadState('error');
		}
	};

	const downloadZip = async () => {
		if (zipDownloadState === 'preparing') return;
		const controller = new AbortController();
		zipAbortController.current = controller;
		setZipDownloadState('preparing');
		setZipProgress(0);
		setZipError(undefined);

		try {
			const archive = await createFontSetArchive(items, setZipProgress, {
				signal: controller.signal,
			});
			triggerBlobDownload('fontsource-font-set.zip', archive);
			setZipDownloadState('success');
		} catch (error) {
			if (controller.signal.aborted) {
				setZipDownloadState('idle');
				return;
			}
			setZipError(
				error instanceof FontSetArchiveError && error.code === 'too-large'
					? 'This font set is too large to prepare safely in your browser. Download the families separately.'
					: 'The font set could not be downloaded. Check your connection and try again.',
			);
			setZipDownloadState('error');
		} finally {
			if (zipAbortController.current === controller) {
				zipAbortController.current = undefined;
			}
		}
	};

	useEffect(() => () => zipAbortController.current?.abort(), []);

	useEffect(() => {
		if (!initialImportResult) return;
		navigate(location.pathname, { replace: true, state: null });
	}, [initialImportResult, location.pathname, navigate]);

	const clearProject = () => {
		if (zipBusy) return;
		store.clear();
		setRemovedItem(undefined);
		setClearConfirmationOpen(false);
	};

	const removeItem = (item: ProjectItem) => {
		if (zipBusy) return;
		store.removeItem(item.familyId);
		setRemovedItem(item);
	};

	const undoRemove = () => {
		if (!removedItem) return;
		store.upsertItem(removedItem);
		setRemovedItem(undefined);
	};

	return (
		<div className={classes.page}>
			<header className={classes.intro}>
				<div>
					<h1>Font set</h1>
					<p>
						Keep fonts together while you browse. Download every family in one
						archive or generate one combined website setup.
					</p>
				</div>
				{items.length > 0 && (
					<div className={classes.introActions}>
						<Link className={classes.generateLink} to="/">
							Browse more fonts
						</Link>
						<div className={classes.desktopUtilities}>
							<AddFontSetToCollectionMenu fonts={collectionFonts} />
							<button
								type="button"
								disabled={zipBusy}
								onClick={() => setClearConfirmationOpen(true)}
							>
								Remove all fonts
							</button>
						</div>
						<details className={classes.mobileUtilities}>
							<summary>More actions</summary>
							<div>
								<AddFontSetToCollectionMenu fonts={collectionFonts} />
								<button
									type="button"
									disabled={zipBusy}
									onClick={() => setClearConfirmationOpen(true)}
								>
									Remove all fonts
								</button>
							</div>
						</details>
					</div>
				)}
			</header>

			{importResult && (
				<p className={classes.importNotice} role="status">
					<strong>{importResult.collectionName}</strong>
					{' · '}
					{importResult.addedCount > 0
						? `${importResult.addedCount} ${importResult.addedCount === 1 ? 'font' : 'fonts'} added`
						: 'No new fonts added'}
					{importResult.existingCount > 0 &&
						` · ${importResult.existingCount} already in this font set`}
					{importResult.failedCount > 0 &&
						` · ${importResult.failedCount} unavailable`}
				</p>
			)}

			{removedItem && (
				<div className={classes.undoNotice} role="status">
					<span>
						<strong>{removedItem.displayName}</strong> removed from this font
						set.
					</span>
					<button type="button" onClick={undoRemove}>
						Undo
					</button>
					<button
						type="button"
						aria-label="Dismiss removal confirmation"
						onClick={() => setRemovedItem(undefined)}
					>
						Dismiss
					</button>
				</div>
			)}

			{!ready ? (
				<p className={classes.loading} role="status">
					Loading your saved fonts…
				</p>
			) : items.length === 0 ? (
				<section className={classes.empty}>
					<div className={classes.emptySpecimen}>Aa</div>
					<div>
						<h2>Your font set is empty.</h2>
						<p>
							Open Get font and add a family, or save a developer setup. Your
							choices stay in this browser.
						</p>
						<Link to="/">Choose a font</Link>
					</div>
				</section>
			) : (
				<>
					<section className={classes.fonts} aria-labelledby="fonts-heading">
						<div className={classes.sectionHeading}>
							<div>
								<h2 id="fonts-heading">Your font set</h2>
								<p>
									{items.length} {items.length === 1 ? 'font' : 'fonts'}. Each
									family keeps one setup. Updating it replaces its previous
									settings.
								</p>
							</div>
						</div>
						{items.map((item) => (
							<ProjectFont
								key={item.familyId}
								busy={zipBusy}
								item={item}
								onRemove={() => removeItem(item)}
							/>
						))}
					</section>

					<nav className={classes.taskSwitch} aria-label="Font set output">
						<button
							type="button"
							aria-pressed={view === 'files'}
							data-active={view === 'files' || undefined}
							onClick={() => setView('files')}
						>
							<strong>Files</strong>
							<span>Download complete font families</span>
						</button>
						<button
							type="button"
							aria-pressed={view === 'website'}
							data-active={view === 'website' || undefined}
							onClick={() => setView('website')}
						>
							<strong>Website</strong>
							<span>Generate package or CDN code</span>
						</button>
					</nav>

					{view === 'files' && (
						<section
							className={classes.archiveDownload}
							aria-labelledby="font-set-download-heading"
						>
							<div>
								<h2 id="font-set-download-heading">Download font set</h2>
								<p>
									Get the latest complete desktop and web files for every
									family, organized by font. Each folder includes local CSS;
									fontsource-font-set-cdn.css preserves your saved website
									versions.
								</p>
								{zipDownloadState !== 'idle' && (
									<span
										className={classes.downloadFeedback}
										data-error={zipDownloadState === 'error' || undefined}
										role="status"
									>
										{zipDownloadState === 'preparing'
											? `Preparing ${zipProgress} of ${items.length} ${items.length === 1 ? 'font' : 'fonts'}…`
											: zipDownloadState === 'success'
												? 'Font set download started.'
												: zipError}
									</span>
								)}
							</div>
							<button
								type="button"
								disabled={zipDownloadState === 'preparing'}
								onClick={downloadZip}
							>
								<IconDownload aria-hidden size={18} />
								{zipDownloadState === 'preparing'
									? 'Preparing ZIP…'
									: zipDownloadState === 'error'
										? 'Try ZIP download again'
										: 'Download all families (.zip)'}
							</button>
						</section>
					)}

					{view === 'website' && (
						<section
							className={classes.delivery}
							id="selected-fonts-code"
							aria-labelledby="delivery-heading"
						>
							<div className={classes.deliveryHeading}>
								<div>
									<h2 id="delivery-heading">
										{singleItem
											? `Website setup for ${singleItem.displayName}`
											: 'Add this font set to a website'}
									</h2>
									<p>
										{singleItem
											? 'This is the same configured family available from its Get font page. Install the package to self-host it, or use an exact-version public CDN link.'
											: 'Install the packages to self-host every family, or use exact-version links from the public CDN.'}
									</p>
								</div>
								<fieldset className={classes.methodSwitch}>
									<legend>
										Choose how to load {singleItem ? 'the font' : 'the fonts'}
									</legend>
									<button
										type="button"
										data-active={method === 'package' || undefined}
										aria-pressed={method === 'package'}
										onClick={() => setMethod('package')}
									>
										Packages
									</button>
									<button
										type="button"
										data-active={method === 'cdn' || undefined}
										aria-pressed={method === 'cdn'}
										onClick={() => setMethod('cdn')}
									>
										CDN links
									</button>
								</fieldset>
							</div>
							{staleRegistryItems.length > 0 && (
								<div className={classes.reviewNotice} role="status">
									<strong>Review saved setups</strong>
									<p>
										Your generated code still uses the saved package choices.
										Open{' '}
										{staleRegistryItems.map((item, index) => (
											<Fragment key={item.familyId}>
												{index > 0 &&
													(index === staleRegistryItems.length - 1
														? ' and '
														: ', ')}
												<Link to={getProjectEditUrl(item)}>
													{item.displayName}
												</Link>
											</Fragment>
										))}{' '}
										to refresh specialist behavior and license details.
									</p>
								</div>
							)}

							<div className={classes.outputGrid}>
								<aside className={classes.deliverySummary}>
									<p>Generated code</p>
									<dl>
										<div>
											<dt>Fonts</dt>
											<dd>{items.length}</dd>
										</div>
										<div>
											<dt>Loads from</dt>
											<dd>
												{method === 'package' ? 'Your website' : 'Public CDN'}
											</dd>
										</div>
										<div>
											<dt>Font versions</dt>
											<dd>Exact versions</dd>
										</div>
										<div>
											<dt>License records</dt>
											<dd>
												{verifiedItems.length}/{items.length} verified
											</dd>
										</div>
									</dl>
									{method === 'package' && (
										<div className={classes.packageManagers}>
											<span>Package manager</span>
											<div>
												{packageManagers.map((item) => (
													<button
														key={item.value}
														type="button"
														data-active={
															packageManager === item.value || undefined
														}
														aria-pressed={packageManager === item.value}
														onClick={() => setPackageManager(item.value)}
													>
														{item.value}
													</button>
												))}
											</div>
										</div>
									)}
								</aside>

								<div className={classes.codeStack}>
									{method === 'package' ? (
										<>
											<CopyCodeBlock
												label={`1 · Install ${singleItem ? 'package' : 'packages'}`}
												code={installCommand}
												language="sh"
											/>
											<CopyCodeBlock
												label="2 · Add font-face CSS"
												code={imports}
												language="css"
											/>
										</>
									) : (
										<CopyCodeBlock
											label="1 · Add font-face CSS"
											code={cdnLinks}
											language="css"
										/>
									)}
									<CopyCodeBlock
										label={`${method === 'package' ? '3' : '2'} · Apply font ${singleItem ? 'class' : 'classes'} in CSS`}
										code={usageCss}
										language="css"
									/>
								</div>
							</div>

							<div className={classes.downloadBar}>
								<div>
									<strong>
										{singleItem
											? 'Need a CDN-ready CSS file?'
											: 'Need one CDN-ready CSS file?'}
									</strong>
									<span>
										This imports the same exact font{' '}
										{singleItem ? 'version' : 'versions'} from jsDelivr and
										includes the {singleItem ? 'class' : 'classes'} above.
									</span>
									{cssDownloadState !== 'idle' && (
										<span
											className={classes.downloadFeedback}
											data-error={cssDownloadState === 'error' || undefined}
											role="status"
										>
											{cssDownloadState === 'success'
												? 'CSS download started.'
												: 'The CSS file could not be downloaded in this browser. Copy the generated code above instead.'}
										</span>
									)}
								</div>
								<button type="button" onClick={downloadCss}>
									<IconDownload aria-hidden size={18} />
									{cssDownloadState === 'error'
										? 'Try CSS download again'
										: 'Download CDN CSS'}
								</button>
							</div>
						</section>
					)}

					<section
						className={classes.licenseReceipt}
						aria-labelledby="font-set-license-heading"
					>
						<div className={classes.licenseReceiptHeading}>
							<div>
								<h2 id="font-set-license-heading">License receipt</h2>
								<p>
									Each family keeps its own registry-verified license. Include
									the matching license when you redistribute font files.
								</p>
							</div>
							<strong>
								{verifiedItems.length}/{items.length} verified
							</strong>
						</div>
						<ul>
							{licenseGroups.map(([licenseId, licensedItems]) => (
								<li key={licenseId}>
									<strong>{licenseId}</strong>
									<span className={classes.licensedFamilies}>
										{licensedItems.map((item, index) => (
											<Fragment key={item.familyId}>
												{index > 0 && ', '}
												<Link to={`/fonts/${item.familyId}/about#license`}>
													{item.displayName}
												</Link>
											</Fragment>
										))}
									</span>
								</li>
							))}
							{unverifiedItems.length > 0 && (
								<li data-warning>
									<strong>Needs verification</strong>
									<span className={classes.licensedFamilies}>
										{unverifiedItems.map((item, index) => (
											<Fragment key={item.familyId}>
												{index > 0 && ', '}
												<Link to={getProjectEditUrl(item)}>
													{item.displayName}
												</Link>
											</Fragment>
										))}
									</span>
								</li>
							)}
						</ul>
					</section>
				</>
			)}

			<Modal
				centered
				onClose={() => setClearConfirmationOpen(false)}
				opened={clearConfirmationOpen}
				size="sm"
				title="Clear this font set?"
			>
				<Text c="dimmed" fz="sm">
					This removes {items.length} {items.length === 1 ? 'font' : 'fonts'}{' '}
					and {items.length === 1 ? 'its' : 'their'} saved website settings from
					this browser.
				</Text>
				<Group justify="flex-end" mt="xl">
					<Button
						variant="subtle"
						onClick={() => setClearConfirmationOpen(false)}
					>
						Keep fonts
					</Button>
					<Button color="red" onClick={clearProject}>
						Remove all
					</Button>
				</Group>
			</Modal>
		</div>
	);
};

export { CurrentProjectPage };
