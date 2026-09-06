import { useValue } from '@legendapp/state/react';
import { Button, Group, Modal, Text } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useFetcher, useSearchParams } from 'react-router';

import { CopyCodeBlock } from '@/components/code/CopyCodeBlock';
import { AddFontSetToCollectionMenu } from '@/features/collections/AddToCollectionMenu';
import { usePackageManager } from '@/hooks/usePackageManager';
import {
	getPackageManagerCommand,
	packageManagerValues,
} from '@/utils/docs/packageManagers';
import { triggerBlobDownload } from '@/utils/download';
import { formatFontLabel } from '@/utils/font-labels';
import classes from './CurrentProjectPage.module.css';
import { useCurrentProjectStore } from './CurrentProjectProvider';
import { createFontSetArchive, FontSetArchiveError } from './downloadFontSet';
import { FontSetFamilyRow } from './FontSetFamilyRow';
import type { ResolvedFontSetFamily } from './model';
import { getCdnStylesheetUrl } from './output';

type DeliveryMethod = 'package' | 'cdn';
type FontSetView = 'files' | 'website';
type ZipDownloadState = 'idle' | 'preparing' | 'success' | 'error';

interface FontSetItemsResponse {
	requestId: string;
	items: ResolvedFontSetFamily[];
	failedIds: string[];
	error?: string;
}

interface RemovedFontSetItem {
	familyId: string;
	family: string;
}

const CurrentProjectPage = () => {
	const store = useCurrentProjectStore();
	const itemFetcher = useFetcher<FontSetItemsResponse>();
	const [searchParams, setSearchParams] = useSearchParams();
	const ready = useValue(store.ready$);
	const savedItems = useValue(store.getItems);
	const savedFamilyIds = savedItems.map((item) => item.familyId);
	const savedFamilySignature = savedFamilyIds.join(',');
	const [reloadVersion, setReloadVersion] = useState(0);
	const requestId = `${savedFamilySignature}:${reloadVersion}`;
	const loadedResponse =
		itemFetcher.data?.requestId === requestId ? itemFetcher.data : undefined;
	const loadedItems = new Map(
		(loadedResponse?.items ?? []).map((item) => [item.familyId, item]),
	);
	const items = savedFamilyIds.flatMap((familyId) => {
		const item = loadedItems.get(familyId);
		return item ? [item] : [];
	});
	const fontSetLoading =
		ready &&
		savedItems.length > 0 &&
		(!loadedResponse || itemFetcher.state !== 'idle');
	const outputsReady =
		Boolean(loadedResponse) && !loadedResponse?.error && items.length > 0;
	const method: DeliveryMethod =
		searchParams.get('method') === 'cdn' ? 'cdn' : 'package';
	const view: FontSetView =
		searchParams.get('view') === 'website' ? 'website' : 'files';
	const [packageManager, setPackageManager] = usePackageManager('pnpm');
	const [removedItem, setRemovedItem] = useState<RemovedFontSetItem>();
	const [clearConfirmationOpen, setClearConfirmationOpen] = useState(false);
	const [zipDownloadState, setZipDownloadState] =
		useState<ZipDownloadState>('idle');
	const [zipProgress, setZipProgress] = useState(0);
	const [zipError, setZipError] = useState<string>();
	const zipAbortController = useRef<AbortController | undefined>(undefined);
	const singleItem = items.length === 1 ? items[0] : undefined;
	const zipBusy = zipDownloadState === 'preparing';
	const packageNames = items.map((item) => item.packageName).join(' ');
	const collectionFonts = items.map((item) => ({
		id: item.familyId,
		family: item.family,
	}));
	const installCommand = getPackageManagerCommand(packageManager, packageNames);
	const imports = items
		.map((item) => `import "${item.packageName}";`)
		.join('\n');
	const cdnLinks = items
		.map(
			(item) => `<link rel="stylesheet" href="${getCdnStylesheetUrl(item)}" />`,
		)
		.join('\n');
	const setNavigationChoice = (
		parameter: 'view' | 'method',
		value: string,
		defaultValue: string,
	) => {
		const next = new URLSearchParams(searchParams);
		if (value === defaultValue) next.delete(parameter);
		else next.set(parameter, value);
		setSearchParams(next);
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
		if (!ready || !savedFamilySignature) return;

		const formData = new FormData();
		formData.set('requestId', requestId);
		for (const familyId of savedFamilySignature.split(',')) {
			formData.append('fontId', familyId);
		}
		itemFetcher.submit(formData, {
			action: '/resources/font-set-items',
			method: 'post',
		});
	}, [itemFetcher.submit, ready, requestId, savedFamilySignature]);

	const clearProject = () => {
		if (zipBusy) return;
		store.clear();
		setRemovedItem(undefined);
		setClearConfirmationOpen(false);
	};

	const removeItem = (item: RemovedFontSetItem) => {
		if (zipBusy) return;
		store.removeItem(item.familyId);
		setRemovedItem(item);
	};

	const undoRemove = () => {
		if (!removedItem) return;
		store.addItem({ familyId: removedItem.familyId });
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
				{savedItems.length > 0 && (
					<div className={classes.introActions}>
						<Link className={classes.generateLink} to="/">
							Browse more fonts
						</Link>
						<div className={classes.desktopUtilities}>
							<AddFontSetToCollectionMenu
								fonts={outputsReady ? collectionFonts : []}
							/>
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
								<AddFontSetToCollectionMenu
									fonts={outputsReady ? collectionFonts : []}
								/>
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

			{removedItem && (
				<div className={classes.undoNotice} role="status">
					<span>
						<strong>{removedItem.family}</strong> removed from this font set.
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

			{loadedResponse?.error || loadedResponse?.failedIds.length ? (
				<div className={classes.undoNotice} role="alert">
					<span>
						{loadedResponse.error ??
							`${loadedResponse.failedIds.length} ${
								loadedResponse.failedIds.length === 1 ? 'font is' : 'fonts are'
							} currently unavailable. ${items.length > 0 ? `The outputs below include the ${items.length} available ${items.length === 1 ? 'font' : 'fonts'}.` : ''}`}
					</span>
					<button
						type="button"
						onClick={() => setReloadVersion((current) => current + 1)}
					>
						Try again
					</button>
				</div>
			) : null}

			{!ready || fontSetLoading ? (
				<p className={classes.loading} role="status">
					Loading your font set…
				</p>
			) : savedItems.length === 0 ? (
				<section className={classes.empty}>
					<div className={classes.emptySpecimen}>Aa</div>
					<div>
						<h2>Your font set is empty.</h2>
						<p>
							Add families while you browse. Your font set stays in this
							browser.
						</p>
						<Link to="/">Choose a font</Link>
					</div>
				</section>
			) : loadedResponse?.error && items.length === 0 ? (
				<section className={classes.empty}>
					<div className={classes.emptySpecimen}>Aa</div>
					<div>
						<h2>Your fonts could not be loaded.</h2>
						<p>Check your connection and try again.</p>
						<button
							type="button"
							onClick={() => setReloadVersion((current) => current + 1)}
						>
							Try again
						</button>
					</div>
				</section>
			) : (
				<>
					{outputsReady && (
						<nav className={classes.taskSwitch} aria-label="Font set output">
							<button
								type="button"
								aria-pressed={view === 'files'}
								data-active={view === 'files' || undefined}
								onClick={() => setNavigationChoice('view', 'files', 'files')}
							>
								<strong>Files</strong>
								<span>Download complete font families</span>
							</button>
							<button
								type="button"
								aria-pressed={view === 'website'}
								data-active={view === 'website' || undefined}
								onClick={() => setNavigationChoice('view', 'website', 'files')}
							>
								<strong>Website</strong>
								<span>Generate package or CDN code</span>
							</button>
						</nav>
					)}

					{outputsReady && view === 'files' && (
						<section
							className={classes.archiveDownload}
							aria-labelledby="font-set-download-heading"
						>
							<div>
								<h2 id="font-set-download-heading">Download font set</h2>
								<p>
									Get the latest complete desktop and web files for every
									family, organized by font. Each family folder includes its
									font files, stylesheets, and license.
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

					{outputsReady && view === 'website' && (
						<section
							className={classes.delivery}
							id="selected-fonts-code"
							aria-labelledby="delivery-heading"
						>
							<div className={classes.deliveryHeading}>
								<div>
									<h2 id="delivery-heading">
										{singleItem
											? `Website setup for ${singleItem.family}`
											: 'Add this font set to a website'}
									</h2>
									<p>
										{singleItem
											? 'Install the package to self-host it, or load it from the public CDN.'
											: 'Install the packages to self-host every family, or load them from the public CDN.'}
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
										onClick={() =>
											setNavigationChoice('method', 'package', 'package')
										}
									>
										Packages
									</button>
									<button
										type="button"
										data-active={method === 'cdn' || undefined}
										aria-pressed={method === 'cdn'}
										onClick={() =>
											setNavigationChoice('method', 'cdn', 'package')
										}
									>
										CDN
									</button>
								</fieldset>
							</div>
							<div className={classes.codeStack}>
								{method === 'package' && (
									<fieldset className={classes.packageManagers}>
										<legend>Package manager</legend>
										<div>
											{packageManagerValues.map((value) => (
												<button
													key={value}
													type="button"
													data-active={packageManager === value || undefined}
													aria-pressed={packageManager === value}
													onClick={() => setPackageManager(value)}
												>
													{value}
												</button>
											))}
										</div>
									</fieldset>
								)}
								{method === 'package' ? (
									<>
										<CopyCodeBlock
											label={`1 · Install ${singleItem ? 'package' : 'packages'}`}
											code={installCommand}
											language="sh"
										/>
										<CopyCodeBlock
											label="2 · Import fonts"
											code={imports}
											language="js"
											scrollable
										/>
									</>
								) : (
									<CopyCodeBlock
										label="1 · Link stylesheets"
										code={cdnLinks}
										language="html"
										scrollable
									/>
								)}
							</div>
						</section>
					)}

					<section className={classes.fonts} aria-labelledby="fonts-heading">
						<div className={classes.sectionHeading}>
							<div>
								<h2 id="fonts-heading">Your font set</h2>
								<p>
									{items.length} {items.length === 1 ? 'font' : 'fonts'} ready
									{loadedResponse?.failedIds.length
										? ` · ${loadedResponse.failedIds.length} unavailable`
										: ''}
									.
								</p>
							</div>
						</div>
						{items.map((item) => (
							<FontSetFamilyRow
								key={item.familyId}
								busy={zipBusy}
								item={item}
								onRemove={() => removeItem(item)}
							/>
						))}
						{loadedResponse?.failedIds.map((familyId) => {
							const family = formatFontLabel(familyId);
							return (
								<article className={classes.unavailableFontRow} key={familyId}>
									<div>
										<h2>{family}</h2>
										<p>This font could not be loaded. Retry or remove it.</p>
									</div>
									<button
										type="button"
										disabled={zipBusy}
										onClick={() => removeItem({ familyId, family })}
									>
										Remove
									</button>
								</article>
							);
						})}
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
					This removes {savedItems.length}{' '}
					{savedItems.length === 1 ? 'font' : 'fonts'} from this browser.
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
