import { Tooltip, VisuallyHidden } from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { Link } from 'react-router';
import { IconCopy } from '@/components/icons';
import type {
	GetFontResponse,
	GetFontStatsResponse,
	GetRegistrySourceCapabilitiesResponse,
	GetRegistryTaxonomyResponse,
	GetVariableFontResponse,
	ListRegistryAxesResponse,
	ListRegistryLanguagesResponse,
} from '@/generated/api';
import {
	fontWeightNames,
	formatFontLabel,
	getAxisLabel,
	getScriptLabel,
} from '@/utils/font-labels';
import { getFontFamilyStack, getFontPreviewFamily } from '@/utils/font-preview';
import {
	getOpenTypeFeatureDescription,
	getOpenTypeFeatureName,
	getRegistryContent,
	getRegistryFamilyKind,
	getRegistryPreviewText,
	type RegistryFamily,
	type RegistrySource,
	usesNameLigatures,
} from '@/utils/registry';

import classes from './FamilyAbout.module.css';
import { FontSkeleton } from './FontSkeleton';
import { RegistryMarkdown } from './RegistryMarkdown';
import { SearchableLanguageList } from './SearchableLanguageList';
import { SearchableMetadataList } from './SearchableMetadataList';
import listClasses from './SearchableMetadataList.module.css';

interface FamilyAboutProps {
	metadata: Omit<GetFontResponse, 'variants'>;
	previewCSS: string;
	variable?: GetVariableFontResponse;
	registry: RegistryFamily;
	languages: ListRegistryLanguagesResponse;
	axisRegistry: ListRegistryAxesResponse;
	taxonomy: GetRegistryTaxonomyResponse;
	capabilities: GetRegistrySourceCapabilitiesResponse;
	stats?: GetFontStatsResponse;
}

const formatDate = (value?: string) => {
	if (!value) return;
	const date = new Date(`${value}T00:00:00Z`);
	if (Number.isNaN(date.valueOf())) return value;
	return new Intl.DateTimeFormat('en', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		timeZone: 'UTC',
	}).format(date);
};

const compactNumber = new Intl.NumberFormat('en', {
	notation: 'compact',
	maximumFractionDigits: 2,
});

const exactNumber = new Intl.NumberFormat('en');

const getRegistryAssetUrl = (value: string) =>
	new URL(value, 'https://api.fontsource.org').toString();

const getSourceSnapshotUrl = (
	repository: string,
	revision: string,
	path: string,
) => {
	const encodedPath = path.split('/').map(encodeURIComponent).join('/');
	return `${repository.replace(/\/$/, '')}/blob/${encodeURIComponent(revision)}/${encodedPath}`;
};

const summarizeDescription = (value?: string) => {
	const description = value?.trim();
	if (!description) return;
	const firstParagraph =
		description.split(/\n\s*\n/u).find(Boolean) ?? description;
	return (
		firstParagraph.match(/^.*?[.!?](?:\s|$)/su)?.[0].trim() ?? firstParagraph
	);
};

const getWeightLabel = (weight: number) =>
	fontWeightNames[weight]
		? `${fontWeightNames[weight]} ${weight}`
		: String(weight);

const getSourceWeightLabel = (source: RegistrySource) => {
	if (typeof source.weight === 'number') {
		return getWeightLabel(source.weight);
	}

	return `${source.weight.min}–${source.weight.max} weight`;
};

const SourceFileItem = ({
	source,
	snapshotUrl,
}: {
	source: RegistrySource;
	snapshotUrl?: string;
}) => {
	const clipboard = useClipboard({ timeout: 1500 });
	const copyLabel = clipboard.copied
		? 'Copied'
		: clipboard.error
			? 'Copy failed'
			: 'Copy checksum';

	return (
		<li>
			<div className={classes.sourceFileDetails}>
				<strong>
					<a
						href={snapshotUrl ?? getRegistryAssetUrl(source.downloadUrl)}
						target="_blank"
						rel="noreferrer"
						aria-label={`View ${source.filename} source file`}
					>
						{source.filename} <span aria-hidden="true">↗</span>
					</a>
				</strong>
				<span className={classes.sourceFileMeta}>
					{formatFontLabel(source.type)} · {formatFontLabel(source.style)} ·{' '}
					{getSourceWeightLabel(source)}
					{source.fontVersion ? ` · ${source.fontVersion}` : ''} ·{' '}
					{(source.size / 1024).toFixed(0)} KB
				</span>
			</div>
			<Tooltip
				multiline
				w={360}
				withArrow
				openDelay={300}
				closeDelay={100}
				events={{ hover: true, focus: true, touch: true }}
				classNames={{ tooltip: classes.checksumTooltip }}
				label={source.sha256}
			>
				<button
					type="button"
					className={classes.sourceChecksum}
					aria-label={`${copyLabel} for ${source.filename}`}
					onClick={() => clipboard.copy(source.sha256)}
				>
					<IconCopy aria-hidden height={16} stroke="currentColor" />
					<span aria-live="polite" aria-atomic="true">
						{copyLabel}
					</span>
				</button>
			</Tooltip>
		</li>
	);
};

const SearchableFeatureList = ({
	familyId,
	featureTags,
}: {
	familyId: string;
	featureTags: string[];
}) => {
	const features = featureTags.map((tag) => ({
		tag,
		name: getOpenTypeFeatureName(tag),
		description: getOpenTypeFeatureDescription(tag),
	}));

	return (
		<SearchableMetadataList
			emptyLabel="No OpenType features match"
			getKey={(feature) => feature.tag}
			getSearchText={({ name, tag, description }) =>
				`${name} ${tag} ${description ?? ''}`
			}
			itemName={{ singular: 'feature', plural: 'features' }}
			items={features}
			listClassName={listClasses.featureList}
			listId={`feature-list-${familyId}`}
			renderItem={({ name, tag, description }) => (
				<>
					<strong>{name}</strong>
					{description && (
						<span className={listClasses.itemDescription}>{description}</span>
					)}
					<code className={listClasses.itemTag}>{tag}</code>
				</>
			)}
			searchId={`feature-search-${familyId}`}
			searchLabel="Search OpenType features"
			searchThreshold={8}
		/>
	);
};

const SearchableAxisList = ({
	familyId,
	axes,
	axisRegistry,
}: {
	familyId: string;
	axes: Array<[string, GetVariableFontResponse['axes'][string]]>;
	axisRegistry: ListRegistryAxesResponse;
}) => {
	const axisItems = axes.map(([tag, range]) => {
		const definition = axisRegistry[tag];
		return {
			tag,
			range,
			name: definition?.name ?? getAxisLabel(tag),
			description: summarizeDescription(definition?.description),
		};
	});

	return (
		<SearchableMetadataList
			emptyLabel="No variable axes match"
			getKey={(axis) => axis.tag}
			getSearchText={({ tag, name, description }) =>
				`${name} ${tag} ${description ?? ''}`
			}
			itemName={{ singular: 'axis', plural: 'axes' }}
			items={axisItems}
			listClassName={listClasses.axisList}
			listId={`axis-list-${familyId}`}
			renderItem={({ tag, range, name, description }) => (
				<>
					<strong>{name}</strong>
					{description && (
						<span className={listClasses.itemDescription}>{description}</span>
					)}
					<span className={listClasses.itemMeta}>
						<code>{tag}</code> · {range.min}–{range.max} · default{' '}
						{range.default}
					</span>
				</>
			)}
			searchId={`axis-search-${familyId}`}
			searchLabel="Search variable font axes"
			searchThreshold={6}
		/>
	);
};

export const FamilyAbout = ({
	metadata,
	previewCSS,
	variable,
	registry,
	languages,
	axisRegistry,
	taxonomy,
	capabilities,
	stats,
}: FamilyAboutProps) => {
	const hasCatalog = Boolean(registry.symbols);
	const hasNamedLigatures = usesNameLigatures(registry);
	const familyKind = getRegistryFamilyKind(registry);
	const content = getRegistryContent(registry);
	const description = content?.description?.trim();
	const article = content?.article?.trim();
	const introduction =
		description ??
		article ??
		`${metadata.family} is an open-source ${formatFontLabel(metadata.category).toLowerCase()} family distributed by Fontsource.`;
	const story =
		description && article && article !== description
			? article.startsWith(description)
				? article.slice(description.length).trim()
				: article
			: '';
	const fontFamily = getFontFamilyStack(metadata, Boolean(variable), registry);
	const previewFamily = getFontPreviewFamily(metadata, Boolean(variable));
	const specimenText =
		(registry.sampleText ||
		(registry.primaryScript && registry.primaryScript !== 'Latn')
			? getRegistryPreviewText(registry, languages)
			: undefined) ?? metadata.family;
	const weightSpecimenText = hasNamedLigatures
		? (specimenText.split(/\s+/u).find(Boolean) ?? metadata.family)
		: metadata.family;
	const specimenStyle = {
		fontFamily,
		fontFeatureSettings: hasNamedLigatures ? '"liga"' : undefined,
	};
	const classifications = registry.classifications.map((id) => ({
		id,
		label: taxonomy.classifications[id]?.label ?? formatFontLabel(id),
	}));
	const tags = registry.tags.map((id) => ({
		id,
		label: taxonomy.tags[id]?.label ?? formatFontLabel(id),
	}));
	const languageCount = registry.languages.length;
	const primaryLanguage = languages.find(
		(language) => language.id === registry.primaryLanguage,
	);
	const axes = Object.entries(variable?.axes ?? {});
	const hasVariableWeight = axes.some(([axis]) => axis === 'wght');
	const sources = registry.sources;
	const sourceFormats = Array.from(
		new Set(sources.map((source) => source.format.toUpperCase())),
	);
	const repository = registry.project?.repository ?? metadata.source;
	const provenanceRepository =
		registry.provenance.type === 'github'
			? registry.provenance.repository
			: undefined;
	const provenanceRevision =
		registry.provenance.type === 'github'
			? registry.provenance.revision
			: undefined;
	const provider = registry.provider;
	const providerLabel = ['google', 'google-icons'].includes(provider)
		? 'Google Fonts'
		: formatFontLabel(provider);
	const updated = formatDate(registry.sourceModified);
	const monthlyUsage = stats
		? [
				{
					provider: 'npm',
					value: stats.total.npmDownloadMonthly,
					unit: 'downloads',
				},
				{
					provider: 'jsDelivr',
					value: stats.total.jsDelivrHitsMonthly,
					unit: 'requests',
				},
			].filter(({ value }) => value > 0)
		: [];
	const featureTags = Array.from(
		new Set([...capabilities.features.gsub, ...capabilities.features.gpos]),
	).sort();
	let coverageDescription =
		'Exact language coverage is not listed. Downloadable subsets describe character groups, not guaranteed language support.';
	if (hasCatalog) {
		coverageDescription = hasNamedLigatures
			? 'This family includes a catalog of named symbol ligatures and their Unicode mappings.'
			: 'This family includes a catalog of mapped symbols.';
	} else if (primaryLanguage) {
		coverageDescription = `${primaryLanguage.preferredName ?? primaryLanguage.name} is listed as the primary language.`;
	} else if (registry.primaryScript) {
		coverageDescription = `${getScriptLabel(registry.primaryScript)} is the primary writing system.`;
	} else if (languageCount > 0) {
		coverageDescription = `${languageCount.toLocaleString('en')} languages are listed for this family.`;
	} else {
		coverageDescription = 'Language support is not listed for this family.';
	}
	return (
		<section className={classes.page} aria-labelledby="about-heading">
			<style
				// biome-ignore lint/security/noDangerouslySetInnerHtml: Generated from owned font metadata.
				dangerouslySetInnerHTML={{ __html: previewCSS }}
			/>

			<div className={classes.intro}>
				<div className={classes.story}>
					<h2 id="about-heading">About {metadata.family}.</h2>
					<div className={classes.prose}>
						<RegistryMarkdown value={introduction} />
					</div>
					<FontSkeleton
						name="font-detail-about-specimen"
						family={previewFamily}
						weight={600}
					>
						<div
							className={classes.specimen}
							style={specimenStyle}
							data-category={metadata.category}
							data-family-kind={familyKind}
							role="img"
							aria-label={`${metadata.family} specimen`}
						>
							{specimenText}
						</div>
					</FontSkeleton>
				</div>

				<dl className={classes.facts}>
					{registry.designer && (
						<div>
							<dt>Designer</dt>
							<dd>{registry.designer}</dd>
						</div>
					)}
					<div>
						<dt>Classification</dt>
						<dd>
							{classifications.map((classification, index) => (
								<span key={classification.id}>
									{index > 0 && ', '}
									<Link to={`/categories/${classification.id}`}>
										{classification.label}
									</Link>
								</span>
							))}
						</dd>
					</div>
					<div>
						<dt>Coverage</dt>
						<dd>
							{hasCatalog
								? hasNamedLigatures
									? 'Named symbol catalog'
									: 'Symbol catalog'
								: registry.languages.length > 0
									? `${registry.languages.length.toLocaleString('en')} languages`
									: 'Not listed'}
						</dd>
					</div>
					<div>
						<dt>Package release</dt>
						<dd>{metadata.version}</dd>
					</div>
					{updated && (
						<div>
							<dt>Updated</dt>
							<dd>{updated}</dd>
						</div>
					)}
					{monthlyUsage.length > 0 && (
						<div>
							<dt>Monthly usage</dt>
							<dd>
								<ul className={classes.usageStats}>
									{monthlyUsage.map(({ provider, value, unit }) => (
										<li key={provider}>
											<span>{provider}</span>
											<span className={classes.usageValue}>
												<span aria-hidden="true">
													{compactNumber.format(value)} {unit}
												</span>
												<VisuallyHidden>
													{exactNumber.format(value)} {unit} last month
												</VisuallyHidden>
											</span>
										</li>
									))}
								</ul>
							</dd>
						</div>
					)}
					<div>
						<dt>License</dt>
						<dd>
							<a href="#license">{registry.license.id}</a>
						</dd>
					</div>
				</dl>
			</div>

			{tags.length > 0 && (
				<section className={classes.taxonomy} aria-labelledby="tags-heading">
					<div>
						<h2 id="tags-heading">Style and character</h2>
						<p>Visual characteristics associated with this family.</p>
					</div>
					<ul>
						{tags.map((tag) => (
							<li key={tag.id}>
								<Link to={`/tags/${tag.id}`}>{tag.label}</Link>
							</li>
						))}
					</ul>
				</section>
			)}

			{story && (
				<article className={classes.article}>
					<h2>The story</h2>
					<div className={classes.prose}>
						<RegistryMarkdown value={story} />
					</div>
				</article>
			)}

			<section
				className={classes.capabilities}
				aria-labelledby="coverage-heading"
			>
				<div className={classes.sectionHeading}>
					<div>
						<h2 id="coverage-heading">Characters and features</h2>
						<p>What this family includes and how its files are structured.</p>
					</div>
					<Link to={`/fonts/${metadata.id}/glyphs`}>Explore glyphs →</Link>
				</div>

				<div className={classes.capabilityGrid}>
					<div
						className={`${classes.capabilityPanel} ${classes.languagePanel}`}
					>
						<h3>Language and character coverage</h3>
						{(hasCatalog ||
							primaryLanguage ||
							registry.primaryScript ||
							!languageCount ||
							languages.length <= 12) && <p>{coverageDescription}</p>}
						{languages.length > 0 ? (
							<SearchableLanguageList
								familyId={metadata.id}
								languages={languages}
							/>
						) : null}
					</div>

					<div
						className={`${classes.capabilityPanel} ${classes.axisPanel} ${featureTags.length === 0 ? classes.fullWidthPanel : ''}`}
					>
						<h3>
							{metadata.variable ? 'Styles and axes' : 'Styles and weights'}
						</h3>
						<p className={classes.styleSummary}>
							{hasVariableWeight && metadata.weights.length === 1
								? 'A continuous range of weights'
								: `${metadata.weights.length} ${metadata.weights.length === 1 ? 'weight' : 'weights'}`}{' '}
							· {metadata.styles.map(formatFontLabel).join(', ')}
						</p>
						{axes.length > 0 ? (
							<>
								<p className={classes.axisIntro}>
									Variable axes let you fine-tune the design between the values
									shown.
								</p>
								<SearchableAxisList
									familyId={metadata.id}
									axes={axes}
									axisRegistry={axisRegistry}
								/>
							</>
						) : metadata.variable ? (
							<p>This variable font does not publish axis details.</p>
						) : (
							<>
								<p className={classes.axisIntro}>
									Each weight is provided as a separate font file.
								</p>
								<ul className={classes.weightList}>
									{metadata.weights.map((weight) => (
										<li key={weight}>
											<span
												aria-hidden="true"
												className={classes.weightSample}
												style={{
													...specimenStyle,
													fontWeight: weight,
												}}
											>
												{weightSpecimenText}
											</span>
											<span className={classes.weightLabel}>
												{getWeightLabel(weight)}
											</span>
										</li>
									))}
								</ul>
							</>
						)}
					</div>

					{featureTags.length > 0 && (
						<div className={classes.capabilityPanel}>
							<h3>OpenType features</h3>
							<p>Availability can vary between files.</p>
							<SearchableFeatureList
								familyId={metadata.id}
								featureTags={featureTags}
							/>
						</div>
					)}
				</div>
			</section>

			<section
				className={classes.license}
				id="license"
				aria-labelledby="license-heading"
			>
				<div className={classes.sectionHeading}>
					<div>
						<h2 id="license-heading">License</h2>
						<p>Complete terms and attribution for this font.</p>
					</div>
					<a href={registry.license.url} target="_blank" rel="noreferrer">
						View license source →
					</a>
				</div>

				<div className={classes.licenseDocument}>
					{registry.license.attribution && (
						<div className={classes.licenseAttribution}>
							<strong>Attribution</strong>
							<p>{registry.license.attribution}</p>
						</div>
					)}
					<section
						className={classes.licenseText}
						aria-label={`${registry.license.id} license text`}
						// biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to scroll the bounded license document independently.
						tabIndex={0}
					>
						<pre>{registry.license.text}</pre>
					</section>
				</div>
			</section>

			<section
				className={classes.provenance}
				aria-labelledby="provenance-heading"
			>
				<div className={classes.sectionHeading}>
					<div>
						<h2 id="provenance-heading">Provenance</h2>
						<p>Where the files came from and what Fontsource distributes.</p>
					</div>
					<a href={repository} target="_blank" rel="noreferrer">
						View upstream project →
					</a>
				</div>

				<dl className={classes.sourceSummary}>
					<div>
						<dt>Provider</dt>
						<dd>{providerLabel}</dd>
					</div>
					{sources.length > 0 && (
						<div>
							<dt>Source files</dt>
							<dd>{sources.length}</dd>
						</div>
					)}
					{sourceFormats.length > 0 && (
						<div>
							<dt>Formats</dt>
							<dd>{sourceFormats.join(', ')}</dd>
						</div>
					)}
					{provenanceRevision && provenanceRepository && (
						<div>
							<dt>Revision</dt>
							<dd>
								<a
									href={`${provenanceRepository.replace(/\/$/, '')}/commit/${provenanceRevision}`}
									target="_blank"
									rel="noreferrer"
								>
									<code>{provenanceRevision.slice(0, 10)}</code>
								</a>
							</dd>
						</div>
					)}
				</dl>

				{sources.length > 0 && (
					<div className={classes.sourceFiles}>
						<ul aria-label="Source files">
							{sources.map((source) => (
								<SourceFileItem
									key={source.sha256}
									source={source}
									snapshotUrl={
										provenanceRepository && provenanceRevision
											? getSourceSnapshotUrl(
													provenanceRepository,
													provenanceRevision,
													source.path,
												)
											: undefined
									}
								/>
							))}
						</ul>
					</div>
				)}
			</section>

			{registry.replacedBy && (
				<section className={classes.related} aria-labelledby="related-heading">
					<div className={classes.sectionHeading}>
						<div>
							<h2 id="related-heading">Related families</h2>
							<p>
								The Fontsource Registry recommends a maintained successor for
								this family.
							</p>
						</div>
					</div>
					<ul>
						<li>
							<Link to={`/fonts/${registry.replacedBy}`}>
								<strong>{formatFontLabel(registry.replacedBy)}</strong>
								<span>Recommended replacement</span>
							</Link>
						</li>
					</ul>
				</section>
			)}
		</section>
	);
};
