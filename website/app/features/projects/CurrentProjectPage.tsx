import { useValue } from '@legendapp/state/react';
import {
	Button,
	Group,
	Modal,
	SegmentedControl,
	Tabs,
	Text,
} from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useFetcher, useSearchParams } from 'react-router';

import { CopyCodeBlock } from '@/components/code/CopyCodeBlock';
import { PackageManagerCode } from '@/components/code/PackageManagerCode';
import { AddFontSetToCollectionMenu } from '@/features/collections/AddToCollectionMenu';
import { triggerBlobDownload } from '@/utils/download';
import { formatFontLabel } from '@/utils/font-labels';
import classes from './CurrentProjectPage.module.css';
import { useCurrentProjectStore } from './CurrentProjectProvider';
import { createFontSetArchive, FontSetArchiveError } from './downloadFontSet';
import { FontSetFamilyRow } from './FontSetFamilyRow';
import type { ResolvedFontSetFamily } from './model';
import { getCdnStylesheetUrl, getFontSetUsageCSS } from './output';

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
		(itemFetcher.data?.items ?? []).map((item) => [item.familyId, item]),
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
		!fontSetLoading &&
		Boolean(loadedResponse) &&
		!loadedResponse?.error &&
		loadedResponse?.failedIds.length === 0 &&
		items.length > 0 &&
		items.length === savedItems.length;
	const method: DeliveryMethod =
		searchParams.get('method') === 'cdn' ? 'cdn' : 'package';
	const view: FontSetView =
		searchParams.get('view') === 'website' ? 'website' : 'files';
	const [removedItem, setRemovedItem] = useState<RemovedFontSetItem>();
	const [clearConfirmationOpen, setClearConfirmationOpen] = useState(false);
	const [zipDownloadState, setZipDownloadState] =
		useState<ZipDownloadState>('idle');
	const [zipProgress, setZipProgress] = useState(0);
	const [zipError, setZipError] = useState<string>();
	const zipAbortController = useRef<AbortController | undefined>(undefined);
	const zipBusy = zipDownloadState === 'preparing';
	const packageNames = items.map((item) => item.packageName).join(' ');
	const collectionFonts = items.map((item) => ({
		id: item.familyId,
		family: item.family,
	}));
	const imports = items
		.map((item) => `import "${item.packageName}/index.css";`)
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
		setSearchParams(next, { preventScrollReset: true });
	};

	const downloadZip = async () => {
		if (!outputsReady || zipBusy) return;
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
		setReloadVersion((current) => current + 1);
		store.addItem({ familyId: removedItem.familyId });
		setRemovedItem(undefined);
	};

	return (
		<div className={classes.page}>
			<header className={classes.intro}>
				<div>
					<h1>
						Font set
						{ready && savedItems.length > 0 && <span>{savedItems.length}</span>}
					</h1>
					<p>Download your fonts together, or use them on a website.</p>
				</div>
				{savedItems.length > 0 && (
					<Group gap="xs" className={classes.utilities}>
						<Button component={Link} to="/" variant="subtle">
							Browse fonts
						</Button>
						<AddFontSetToCollectionMenu
							fonts={outputsReady ? collectionFonts : []}
						/>
						<Button
							variant="subtle"
							color="gray"
							disabled={zipBusy}
							onClick={() => setClearConfirmationOpen(true)}
						>
							Remove all
						</Button>
					</Group>
				)}
			</header>

			{removedItem && (
				<div className={classes.notice} role="status">
					<span>{removedItem.family} removed.</span>
					<Button variant="subtle" disabled={zipBusy} onClick={undoRemove}>
						Undo
					</Button>
					<Button
						variant="subtle"
						color="gray"
						onClick={() => setRemovedItem(undefined)}
					>
						Dismiss
					</Button>
				</div>
			)}

			{!ready ? (
				<p role="status">Loading your font set…</p>
			) : savedItems.length === 0 ? (
				<section className={classes.empty}>
					<h2>Your font set is empty.</h2>
					<p>
						Add fonts while you browse. Your selection stays in this browser.
					</p>
					<Button component={Link} to="/">
						Browse fonts
					</Button>
				</section>
			) : (
				<>
					<Tabs
						value={view}
						onChange={(value) =>
							value && setNavigationChoice('view', value, 'files')
						}
					>
						<Tabs.List aria-label="Font set output">
							<Tabs.Tab value="files">Download files</Tabs.Tab>
							<Tabs.Tab value="website">Website setup</Tabs.Tab>
						</Tabs.List>
						<Tabs.Panel value="files" className={classes.download}>
							<div>
								<h2>All your fonts, one ZIP</h2>
								<p>
									Complete desktop and web files, stylesheets, and licenses.
									Organized by family.
								</p>
							</div>
							<Button
								className={classes.downloadButton}
								leftSection={<IconDownload aria-hidden size={18} />}
								disabled={!outputsReady || zipBusy}
								onClick={downloadZip}
							>
								{zipBusy ? 'Preparing ZIP…' : 'Download all (.zip)'}
							</Button>
						</Tabs.Panel>
						<Tabs.Panel value="website" className={classes.website}>
							<div className={classes.deliveryHeading}>
								<div>
									<h2>Use your fonts on the web</h2>
									<p>
										{method === 'package'
											? 'Install the packages to serve the fonts with your app.'
											: 'Load the stylesheets from jsDelivr in your HTML.'}
									</p>
								</div>
								<SegmentedControl
									aria-label="Font delivery"
									value={method}
									onChange={(value) =>
										setNavigationChoice('method', value, 'package')
									}
									data={[
										{ label: 'Packages', value: 'package' },
										{ label: 'CDN', value: 'cdn' },
									]}
								/>
							</div>
							{outputsReady && (
								<div className={classes.codeStack}>
									{method === 'package' ? (
										<>
											<PackageManagerCode cmd={packageNames} />
											<CopyCodeBlock
												label="Import fonts"
												description={
													<>
														Import these stylesheets once in your app’s entry
														file.{' '}
														<Link to="/docs/getting-started/install">
															Installation guide
														</Link>
													</>
												}
												code={imports}
												language="js"
												scrollable
											/>
										</>
									) : (
										<CopyCodeBlock
											label="Link stylesheets"
											description={
												<>
													Add these links inside your HTML{' '}
													<code>&lt;head&gt;</code>.
												</>
											}
											code={cdnLinks}
											language="html"
											scrollable
										/>
									)}
									<CopyCodeBlock
										label="Apply the fonts"
										description="Use these classes on your elements, or copy a font-family declaration into your existing CSS."
										code={getFontSetUsageCSS(items)}
										language="css"
										scrollable
									/>
								</div>
							)}
						</Tabs.Panel>
					</Tabs>

					{zipDownloadState !== 'idle' && (
						<p role="status" className={classes.feedback}>
							{zipBusy
								? `Preparing ${zipProgress} of ${items.length} fonts…`
								: zipDownloadState === 'success'
									? 'Font set download started.'
									: zipError}
						</p>
					)}
					{fontSetLoading ? (
						<p role="status">Loading font details…</p>
					) : (
						!outputsReady && (
							<div className={classes.notice} role="alert">
								<span>
									{loadedResponse?.error ??
										'Some fonts could not be loaded. Retry or remove them to use the complete set.'}
								</span>
								<Button
									variant="subtle"
									onClick={() => setReloadVersion((current) => current + 1)}
								>
									Try again
								</Button>
							</div>
						)
					)}
					<section className={classes.fonts} aria-label="Selected fonts">
						{savedFamilyIds.map((familyId) => {
							const item = loadedItems.get(familyId);
							if (item)
								return (
									<FontSetFamilyRow
										key={familyId}
										busy={zipBusy}
										item={item}
										onRemove={() => removeItem(item)}
									/>
								);
							const family = formatFontLabel(familyId);
							return (
								<article className={classes.unavailableFontRow} key={familyId}>
									<div>
										<h2>
											<Link to={`/fonts/${familyId}`}>{family}</Link>
										</h2>
										<p>
											{fontSetLoading
												? 'Loading font details…'
												: 'Font details unavailable.'}
										</p>
									</div>
									<Button
										variant="subtle"
										color="gray"
										disabled={zipBusy}
										aria-label={`Remove ${family} from font set`}
										onClick={() => removeItem({ familyId, family })}
									>
										Remove
									</Button>
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
					<Button color="red" disabled={zipBusy} onClick={clearProject}>
						Remove all
					</Button>
				</Group>
			</Modal>
		</div>
	);
};

export { CurrentProjectPage };
