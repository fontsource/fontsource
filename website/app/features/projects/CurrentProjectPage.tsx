/*
THESIS: Font Set turns separate font decisions into one calm, exact setup and refuses cart chrome.
OWN-WORLD: Open white work surfaces, ink typography, violet task state, flat ruled rows, and navy code panels.
STORY: Choose fonts in their own specimens, keep one configured setup per family, then generate a combined delivery plan.
FIRST VIEWPORT: A plain-language project heading leads into real font specimens; acquisition output waits until the set is understood.
FORM: A full-page workbench extending Fontsource's established Operate mode; directly selected, with no concept seed required.
*/
import { useValue } from '@legendapp/state/react';
import { useClipboard, useLocalStorage } from '@mantine/hooks';
import {
	IconCheck,
	IconCopy,
	IconDownload,
	IconExternalLink,
	IconStack2,
	IconTrash,
} from '@tabler/icons-react';
import { Fragment, useState } from 'react';
import { Link } from 'react-router';

import { deserializeStoredChoice } from '@/utils/browser-storage';
import { packageManagers } from '@/utils/docs/packageManagers';
import { triggerBlobDownload } from '@/utils/download';

import classes from './CurrentProjectPage.module.css';
import { useCurrentProjectStore } from './CurrentProjectProvider';
import type { ProjectItem } from './model';
import {
	getCdnUrl,
	getProjectCss,
	getUsageBlock,
	getUsageNote,
	hasSymbolCatalog,
	isDigitalFamily,
	usesNameLigatures,
} from './output';

type DeliveryMethod = 'package' | 'cdn';
type CssDownloadState = 'idle' | 'success' | 'error';
const packageManagerValues = packageManagers.map((manager) => manager.value);

const humanize = (value: string) =>
	value
		.split(/[-_]/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');

const ProjectCodeBlock = ({ code, label }: { code: string; label: string }) => {
	const clipboard = useClipboard({ timeout: 1500 });
	const copyLabel = clipboard.copied
		? 'Copied'
		: clipboard.error
			? 'Copy failed'
			: 'Copy';

	return (
		<div className={classes.codeBlock}>
			<div className={classes.codeHeader}>
				<span>{label}</span>
				<button type="button" onClick={() => clipboard.copy(code)}>
					{clipboard.copied ? (
						<IconCheck aria-hidden size={16} />
					) : (
						<IconCopy aria-hidden size={16} />
					)}
					<span aria-live="polite" aria-atomic="true">
						{copyLabel}
					</span>
				</button>
			</div>
			<pre>
				<code>{code}</code>
			</pre>
		</div>
	);
};

const ProjectFont = ({
	item,
	onRemove,
}: {
	item: ProjectItem;
	onRemove: () => void;
}) => {
	const [expanded, setExpanded] = useState(false);
	const variationSettings = Object.entries(item.axes)
		.map(([axis, value]) => `"${axis}" ${value}`)
		.join(', ');
	const tags = item.tags.slice(0, 2);
	const usageNote = item.registryFactsCurrent
		? getUsageNote(item)
		: 'Registry behavior facts are missing from this saved setup. Open the family and update it before using generated code.';

	return (
		<article className={classes.fontRow} data-expanded={expanded || undefined}>
			<link rel="stylesheet" href={getCdnUrl(item)} />
			<div
				className={classes.specimen}
				data-compact={
					hasSymbolCatalog(item) || isDigitalFamily(item) || undefined
				}
				style={{
					fontFamily: item.fontFamily,
					fontFeatureSettings: usesNameLigatures(item) ? '"liga"' : undefined,
					fontVariationSettings: variationSettings || undefined,
					fontWeight: item.weight,
					fontStyle: item.style,
				}}
			>
				{item.sampleText}
			</div>
			<div className={classes.fontDetails}>
				<div className={classes.fontTitle}>
					<div>
						<h2>{item.displayName}</h2>
						<p>
							{item.designer ? `By ${item.designer} · ` : ''}
							{humanize(item.classification)} · Package {item.packageVersion}
						</p>
					</div>
					{(item.status === 'deprecated' || !item.registryFactsCurrent) && (
						<span className={classes.status}>
							{[
								item.status === 'deprecated' ? 'Deprecated' : undefined,
								!item.registryFactsCurrent ? 'Refresh needed' : undefined,
							]
								.filter(Boolean)
								.join(' · ')}
						</span>
					)}
				</div>
				<p className={classes.setupSummary}>
					{humanize(item.format)} ·{' '}
					{hasSymbolCatalog(item)
						? usesNameLigatures(item)
							? 'Symbol ligatures'
							: 'Symbol catalog'
						: humanize(item.subset)}{' '}
					· {item.weight} {humanize(item.style)}
				</p>
				<div
					className={classes.expandedDetails}
					id={`selected-font-details-${item.familyId}`}
					hidden={!expanded}
				>
					{tags.length > 0 && (
						<ul className={classes.tags}>
							{tags.map((tag) => (
								<li key={tag}>{humanize(tag)}</li>
							))}
						</ul>
					)}
					<dl className={classes.setup}>
						<div>
							<dt>Font format</dt>
							<dd>{humanize(item.format)}</dd>
						</div>
						<div>
							<dt>
								{hasSymbolCatalog(item) ? 'Package subset' : 'Character subset'}
							</dt>
							<dd>
								{hasSymbolCatalog(item)
									? `${humanize(item.subset)} ${usesNameLigatures(item) ? 'symbol ligatures' : 'symbols'}`
									: humanize(item.subset)}
							</dd>
						</div>
						<div>
							<dt>Weight &amp; style</dt>
							<dd>
								{item.weight} {humanize(item.style)}
							</dd>
						</div>
						<div>
							<dt>License</dt>
							<dd>
								{item.license.verified &&
								item.license.url &&
								item.license.id ? (
									<a href={item.license.url} target="_blank" rel="noreferrer">
										{item.license.id} · verified
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
				</div>
				<div className={classes.rowActions}>
					<Link to={`/fonts/${item.familyId}/use?from=selected-fonts`}>
						Edit setup
					</Link>
					<button
						type="button"
						aria-expanded={expanded}
						aria-controls={`selected-font-details-${item.familyId}`}
						onClick={() => setExpanded((value) => !value)}
					>
						{expanded ? 'Hide details' : 'Show details'}
					</button>
					<button type="button" onClick={onRemove}>
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
	const ready = useValue(store.ready$);
	const items = useValue(store.getItems);
	const [method, setMethod] = useLocalStorage<DeliveryMethod>({
		key: 'current-project-delivery',
		defaultValue: 'package',
		deserialize: (value) =>
			deserializeStoredChoice(value, ['package', 'cdn'] as const, 'package'),
	});
	const [packageManager, setPackageManager] = useLocalStorage({
		key: 'package-manager',
		defaultValue: 'pnpm',
		deserialize: (value) =>
			deserializeStoredChoice(value, packageManagerValues, 'pnpm'),
	});
	const [singleSetupFamilyId, setSingleSetupFamilyId] = useState<string>();
	const [cssDownloadState, setCssDownloadState] =
		useState<CssDownloadState>('idle');
	const singleItem = items.length === 1 ? items[0] : undefined;
	const showSingleSetup =
		singleItem !== undefined && singleSetupFamilyId === singleItem.familyId;
	const showDelivery = items.length > 1 || showSingleSetup;
	const packageNames = items
		.map((item) => `${item.packageName}@${item.packageVersion}`)
		.join(' ');
	const manager =
		packageManagers.find((item) => item.value === packageManager) ??
		packageManagers[0];
	const installCommand = manager.command(packageNames);
	const imports = items
		.map((item) => `import '${item.packageName}/${item.cssFile}';`)
		.join('\n');
	const cdnLinks = items
		.map((item) => `<link rel="stylesheet" href="${getCdnUrl(item)}">`)
		.join('\n');
	const usageCss = items.map(getUsageBlock).join('\n\n');
	const verifiedItems = items.filter((item) => item.license.verified);
	const unverifiedItems = items.filter((item) => !item.license.verified);
	const staleRegistryItems = items.filter((item) => !item.registryFactsCurrent);
	const registryRevisions = Array.from(
		new Set(
			verifiedItems
				.map((item) => item.license.registryRevision)
				.filter((revision): revision is string => Boolean(revision)),
		),
	);
	const licenseGroups = Object.entries(
		verifiedItems.reduce<Record<string, ProjectItem[]>>((groups, item) => {
			const id = item.license.id ?? 'Unknown license';
			groups[id] = [...(groups[id] ?? []), item];
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

	const clearProject = () => {
		if (
			window.confirm(
				`Remove all ${items.length} ${items.length === 1 ? 'font' : 'fonts'} from this set?\n\nTheir saved settings will be deleted from this browser.`,
			)
		) {
			store.clear();
		}
	};

	const revealSingleSetup = () => {
		if (!singleItem) return;

		setSingleSetupFamilyId(singleItem.familyId);
		window.setTimeout(() => {
			document
				.getElementById('selected-fonts-code')
				?.scrollIntoView({ block: 'start' });
		});
	};

	return (
		<div className={classes.page}>
			<header className={classes.intro}>
				<div>
					<p className={classes.kicker}>Saved in this browser</p>
					<h1>Font set</h1>
					<p>
						Keep exact font setups together. When you choose more than one,
						Fontsource combines them into one website setup.
					</p>
				</div>
				{items.length > 0 && (
					<div className={classes.introActions}>
						{singleItem ? (
							<>
								<Link className={classes.generateLink} to="/">
									Add another font
								</Link>
								<button type="button" onClick={revealSingleSetup}>
									Generate this setup
								</button>
							</>
						) : (
							<>
								<a className={classes.generateLink} href="#selected-fonts-code">
									Generate combined code
								</a>
								<Link to="/">Browse more fonts</Link>
							</>
						)}
						<button type="button" onClick={clearProject}>
							Remove all fonts
						</button>
					</div>
				)}
			</header>

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
							Open a font, choose the settings you want, then select “Add to
							font set.” Your choices stay in this browser.
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
								item={item}
								onRemove={() => store.removeItem(item.familyId)}
							/>
						))}
					</section>

					{singleItem && !showSingleSetup && (
						<section
							className={classes.singlePrompt}
							aria-labelledby="single-prompt-heading"
						>
							<IconStack2 aria-hidden size={28} stroke={1.7} />
							<div>
								<h2 id="single-prompt-heading">
									Add another font to build a combined setup
								</h2>
								<p>
									{singleItem.displayName} is saved. Its individual package,
									CDN, and download instructions remain available on the font
									page.
								</p>
							</div>
							<div>
								<Link to="/">Browse fonts</Link>
								<button type="button" onClick={revealSingleSetup}>
									Generate only {singleItem.displayName}
								</button>
							</div>
						</section>
					)}

					{showDelivery && (
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
								<p className={classes.licenseWarning} role="status">
									{staleRegistryItems.length}{' '}
									{staleRegistryItems.length === 1
										? 'font needs'
										: 'fonts need'}
									a Registry refresh. Generated code preserves saved package
									choices, but specialist behavior may be incomplete until you
									update {staleRegistryItems.length === 1 ? 'it' : 'them'} from
									the linked font page.
								</p>
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
											<ProjectCodeBlock
												label={`1 · Install ${singleItem ? 'package' : 'packages'}`}
												code={installCommand}
											/>
											<ProjectCodeBlock
												label={`2 · Import font ${singleItem ? 'style' : 'styles'}`}
												code={imports}
											/>
										</>
									) : (
										<ProjectCodeBlock
											label="1 · Add stylesheet links to HTML"
											code={cdnLinks}
										/>
									)}
									<ProjectCodeBlock
										label={`${method === 'package' ? '3' : '2'} · Apply font ${singleItem ? 'class' : 'classes'} in CSS`}
										code={usageCss}
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
												<Link
													to={`/fonts/${item.familyId}/use?from=selected-fonts`}
												>
													{item.displayName}
												</Link>
											</Fragment>
										))}
									</span>
								</li>
							)}
						</ul>
						{unverifiedItems.length > 0 && (
							<p className={classes.licenseWarning}>
								Open each family above, review its registry license, then choose
								“Update font set” to refresh this receipt before redistributing
								the files.
							</p>
						)}
						{registryRevisions.length > 0 && (
							<p className={classes.receiptMeta}>
								Registry snapshot{' '}
								{registryRevisions
									.map((revision) => revision.slice(0, 10))
									.join(', ')}
								. Package versions are pinned in each font setup above.
							</p>
						)}
					</section>
				</>
			)}
		</div>
	);
};

export { CurrentProjectPage };
