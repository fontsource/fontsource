import { Tooltip, VisuallyHidden } from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { IconCopy, IconSearch } from '@/components/icons';
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
	type RegistryDataState,
	type RegistryFamily,
	type RegistrySource,
	usesNameLigatures,
} from '@/utils/registry';

import classes from './FamilyAbout.module.css';
import { FontSkeleton } from './FontSkeleton';
import { RegistryMarkdown } from './RegistryMarkdown';
import { SearchableLanguageList } from './SearchableLanguageList';
import listClasses from './SearchableMetadataList.module.css';

interface FamilyAboutProps {
	metadata: GetFontResponse;
	staticCSS: string;
	variable?: GetVariableFontResponse;
	variableCSS?: string;
	registry?: RegistryFamily;
	languages?: ListRegistryLanguagesResponse;
	axisRegistry?: ListRegistryAxesResponse;
	taxonomy?: GetRegistryTaxonomyResponse;
	capabilities?: GetRegistrySourceCapabilitiesResponse;
	capabilitySource?: RegistrySource;
	stats?: GetFontStatsResponse;
	registryState: RegistryDataState;
	enrichmentUnavailable?: boolean;
	capabilitiesState: RegistryDataState;
	variableUnavailable?: boolean;
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

const normalizeSearchValue = (value: string) =>
	value.trim().toLowerCase().replace(/[_-]+/g, ' ');

const summarizeDescription = (value?: string) => {
	const description = value?.trim();
	if (!description) return;
	return description.match(/^.*?[.!?](?:\s|$)/u)?.[0].trim() ?? description;
};

const weightNames: Record<number, string> = {
	100: 'Thin',
	200: 'Extra light',
	300: 'Light',
	400: 'Regular',
	500: 'Medium',
	600: 'Semibold',
	700: 'Bold',
	800: 'Extra bold',
	900: 'Black',
};

const getWeightLabel = (weight: number) =>
	weightNames[weight] ? `${weightNames[weight]} ${weight}` : String(weight);

const SourceFileItem = ({
	source,
	mappedCharacterCount,
}: {
	source: RegistrySource;
	mappedCharacterCount?: number;
}) => {
	const clipboard = useClipboard({ timeout: 1500 });
	const copyLabel = clipboard.copied
		? 'Copied'
		: clipboard.error
			? 'Copy failed'
			: 'Copy checksum';

	return (
		<li>
			<div>
				<strong>
					<a
						href={getRegistryAssetUrl(source.downloadUrl)}
						target="_blank"
						rel="noreferrer"
					>
						{source.filename}
					</a>
				</strong>
				<span>
					{formatFontLabel(source.type)} · {source.format.toUpperCase()} ·{' '}
					{formatFontLabel(source.style)} · {(source.size / 1024).toFixed(0)} KB
					{mappedCharacterCount === undefined
						? ''
						: ` · ${mappedCharacterCount.toLocaleString('en')} mapped characters`}
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
	const [query, setQuery] = useState('');
	const normalizedQuery = normalizeSearchValue(query);
	const features = useMemo(
		() =>
			featureTags.map((tag) => ({
				tag,
				name: getOpenTypeFeatureName(tag),
				description: getOpenTypeFeatureDescription(tag),
			})),
		[featureTags],
	);
	const filteredFeatures = useMemo(
		() =>
			normalizedQuery
				? features.filter(({ name, tag, description }) =>
						normalizeSearchValue(
							`${name} ${tag} ${description ?? ''}`,
						).includes(normalizedQuery),
					)
				: features,
		[features, normalizedQuery],
	);
	const listId = `feature-list-${familyId}`;

	return (
		<div className={listClasses.root}>
			{featureTags.length > 8 && (
				<label
					htmlFor={`feature-search-${familyId}`}
					className={listClasses.search}
				>
					<IconSearch aria-hidden height={16} />
					<VisuallyHidden>Search OpenType features</VisuallyHidden>
					<input
						id={`feature-search-${familyId}`}
						type="search"
						autoComplete="off"
						placeholder={`Search ${featureTags.length.toLocaleString('en')} features`}
						value={query}
						aria-controls={listId}
						onChange={(event) => setQuery(event.currentTarget.value)}
					/>
				</label>
			)}

			{query && filteredFeatures.length > 0 && (
				<p className={listClasses.status} role="status">
					{filteredFeatures.length.toLocaleString('en')} matching{' '}
					{filteredFeatures.length === 1 ? 'feature' : 'features'}
				</p>
			)}

			{filteredFeatures.length > 0 ? (
				<ul
					id={listId}
					className={`${listClasses.list} ${listClasses.featureList}`}
				>
					{filteredFeatures.map(({ name, tag, description }) => (
						<li key={tag}>
							<strong>{name}</strong>
							{description && (
								<span className={listClasses.itemDescription}>
									{description}
								</span>
							)}
							<code className={listClasses.itemTag}>{tag}</code>
						</li>
					))}
				</ul>
			) : (
				<p id={listId} className={listClasses.empty} role="status">
					No OpenType features match “{query}”.
				</p>
			)}
		</div>
	);
};

const SearchableAxisList = ({
	familyId,
	axes,
	axisRegistry,
}: {
	familyId: string;
	axes: Array<[string, GetVariableFontResponse['axes'][string]]>;
	axisRegistry?: ListRegistryAxesResponse;
}) => {
	const [query, setQuery] = useState('');
	const normalizedQuery = normalizeSearchValue(query);
	const axisItems = useMemo(
		() =>
			axes.map(([tag, range]) => {
				const definition = axisRegistry?.[tag];
				return {
					tag,
					range,
					name: definition?.name ?? getAxisLabel(tag),
					description: summarizeDescription(definition?.description),
				};
			}),
		[axes, axisRegistry],
	);
	const filteredAxes = useMemo(
		() =>
			normalizedQuery
				? axisItems.filter(({ tag, name, description }) =>
						normalizeSearchValue(
							`${name} ${tag} ${description ?? ''}`,
						).includes(normalizedQuery),
					)
				: axisItems,
		[axisItems, normalizedQuery],
	);
	const listId = `axis-list-${familyId}`;

	return (
		<div className={listClasses.root}>
			{axes.length > 6 && (
				<label
					htmlFor={`axis-search-${familyId}`}
					className={listClasses.search}
				>
					<IconSearch aria-hidden height={16} />
					<VisuallyHidden>Search variable font axes</VisuallyHidden>
					<input
						id={`axis-search-${familyId}`}
						type="search"
						autoComplete="off"
						placeholder={`Search ${axes.length.toLocaleString('en')} axes`}
						value={query}
						aria-controls={listId}
						onChange={(event) => setQuery(event.currentTarget.value)}
					/>
				</label>
			)}

			{query && filteredAxes.length > 0 && (
				<p className={listClasses.status} role="status">
					{filteredAxes.length.toLocaleString('en')} matching{' '}
					{filteredAxes.length === 1 ? 'axis' : 'axes'}
				</p>
			)}

			{filteredAxes.length > 0 ? (
				<ul
					id={listId}
					className={`${listClasses.list} ${listClasses.axisList}`}
				>
					{filteredAxes.map(({ tag, range, name, description }) => (
						<li key={tag}>
							<strong>{name}</strong>
							{description && (
								<span className={listClasses.itemDescription}>
									{description}
								</span>
							)}
							<span className={listClasses.itemMeta}>
								<code>{tag}</code> · {range.min}–{range.max} · default{' '}
								{range.default}
							</span>
						</li>
					))}
				</ul>
			) : (
				<p id={listId} className={listClasses.empty} role="status">
					No variable axes match “{query}”.
				</p>
			)}
		</div>
	);
};

export const FamilyAbout = ({
	metadata,
	staticCSS,
	variable,
	variableCSS,
	registry,
	languages,
	axisRegistry,
	taxonomy,
	capabilities,
	capabilitySource,
	stats,
	registryState,
	enrichmentUnavailable = false,
	capabilitiesState,
	variableUnavailable = false,
}: FamilyAboutProps) => {
	const hasCatalog = Boolean(registry?.symbols);
	const hasNamedLigatures = usesNameLigatures(registry);
	const familyKind = getRegistryFamilyKind(registry);
	const isSymbolFamily = familyKind === 'symbols';
	const isPunctuationFamily = familyKind === 'punctuation';
	const isDigitalFamily = familyKind === 'digital';
	const isSpecialUseFamily =
		hasCatalog || isSymbolFamily || isPunctuationFamily || isDigitalFamily;
	const content = getRegistryContent(registry);
	const description =
		content?.description ??
		`${metadata.family} is an open-source ${formatFontLabel(metadata.category).toLowerCase()} family distributed by Fontsource.`;
	let article = content?.article;
	if (!article || article === content?.description) {
		article = undefined;
	} else if (content.description && article.startsWith(content.description)) {
		article = article.slice(content.description.length).trim();
	}
	const fontFamily = getFontFamilyStack(metadata, Boolean(variable), registry);
	const previewFamily = getFontPreviewFamily(metadata, Boolean(variable));
	const specimenText =
		(registry?.sampleText ||
		(registry?.primaryScript && registry.primaryScript !== 'Latn')
			? getRegistryPreviewText(registry, languages)
			: undefined) ?? metadata.family;
	const weightSpecimenText = hasNamedLigatures
		? (specimenText.split(/\s+/u).find(Boolean) ?? metadata.family)
		: isSpecialUseFamily
			? Array.from(specimenText).slice(0, 3).join('')
			: metadata.family;
	const specimenStyle = {
		fontFamily,
		fontFeatureSettings: hasNamedLigatures ? '"liga"' : undefined,
	};
	const classifications = registry?.classifications.map(
		(value) =>
			taxonomy?.classifications[value]?.label ?? formatFontLabel(value),
	) ?? [formatFontLabel(metadata.category)];
	const tags =
		registry?.tags.map((id) => ({
			id,
			label: taxonomy?.tags[id]?.label ?? formatFontLabel(id),
		})) ?? [];
	const familyLanguages = languages ?? [];
	const languageCount = registry?.languages.length ?? familyLanguages.length;
	const primaryLanguage = familyLanguages.find(
		(language) => language.id === registry?.primaryLanguage,
	);
	const axes = Object.entries(variable?.axes ?? {});
	const hasVariableWeight = axes.some(([axis]) => axis === 'wght');
	const sources = registry?.sources ?? [];
	const sourceFormats = Array.from(
		new Set(sources.map((source) => source.format.toUpperCase())),
	);
	const repository = registry?.project?.repository ?? metadata.source;
	const provider = registry?.provider ?? metadata.type;
	const providerLabel = ['google', 'google-icons'].includes(provider)
		? 'Google Fonts'
		: formatFontLabel(provider);
	const updated = formatDate(registry?.sourceModified ?? metadata.lastModified);
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
	const featureTags = capabilities
		? Array.from(
				new Set([...capabilities.features.gsub, ...capabilities.features.gpos]),
			).sort()
		: [];
	const availabilityMessage =
		registryState === 'unavailable'
			? 'Some family details are temporarily unavailable. Preview and download options still work.'
			: undefined;
	const technicalAvailabilityMessage =
		registryState === 'available' &&
		(enrichmentUnavailable || capabilitiesState === 'unavailable')
			? 'Some source details are temporarily unavailable. Preview and downloads still work.'
			: undefined;
	let coverageDescription =
		'Exact language coverage is not listed. Downloadable subsets describe character groups, not guaranteed language support.';
	if (hasCatalog) {
		coverageDescription = hasNamedLigatures
			? 'This family includes a catalog of named symbol ligatures and their Unicode mappings.'
			: 'This family includes a catalog of mapped symbols.';
	} else if (isPunctuationFamily) {
		coverageDescription =
			'This family is designed to replace and space Japanese punctuation alongside another Japanese text font.';
	} else if (isDigitalFamily) {
		coverageDescription =
			'This family is designed for numerical readouts and compact display labels.';
	} else if (isSymbolFamily) {
		coverageDescription =
			'This family is intended for mapped symbols rather than running language text.';
	} else if (primaryLanguage) {
		coverageDescription = `${primaryLanguage.preferredName ?? primaryLanguage.name} is listed as the primary language.`;
	} else if (registry?.primaryScript) {
		coverageDescription = `${getScriptLabel(registry.primaryScript)} is the primary writing system.`;
	} else if (languageCount > 0) {
		coverageDescription = `${languageCount.toLocaleString('en')} languages are listed for this family.`;
	} else if (registry) {
		coverageDescription = 'Language support is not listed for this family.';
	}
	return (
		<section className={classes.page} aria-labelledby="about-heading">
			<style
				// biome-ignore lint/security/noDangerouslySetInnerHtml: Generated from owned font metadata.
				dangerouslySetInnerHTML={{ __html: variableCSS ?? staticCSS }}
			/>

			{availabilityMessage && (
				<p className={classes.availabilityNotice} role="status">
					{availabilityMessage}
				</p>
			)}

			<div className={classes.intro}>
				<div className={classes.story}>
					<h2 id="about-heading">About {metadata.family}.</h2>
					<div className={classes.prose}>
						<RegistryMarkdown value={description} />
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
					{registry?.designer && (
						<div>
							<dt>Designer</dt>
							<dd>{registry.designer}</dd>
						</div>
					)}
					<div>
						<dt>Classification</dt>
						<dd>{classifications.join(', ')}</dd>
					</div>
					<div>
						<dt>{isSpecialUseFamily ? 'Character use' : 'Languages'}</dt>
						<dd>
							{hasCatalog
								? hasNamedLigatures
									? 'Named symbol catalog'
									: 'Symbol catalog'
								: isPunctuationFamily
									? 'Japanese punctuation'
									: isDigitalFamily
										? 'Display characters'
										: isSymbolFamily
											? 'Mapped symbols'
											: registry
												? registry.languages.length > 0
													? `${registry.languages.length.toLocaleString('en')} supported`
													: 'Not listed'
												: `${metadata.subsets.length} downloadable subsets`}
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
					{registry?.license.id && (
						<div>
							<dt>License</dt>
							<dd>
								<a href="#license">{registry.license.id}</a>
							</dd>
						</div>
					)}
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
							<li key={tag.id}>{tag.label}</li>
						))}
					</ul>
				</section>
			)}

			{article && (
				<article className={classes.article}>
					<h2>The story</h2>
					<div className={classes.prose}>
						<RegistryMarkdown value={article} />
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
						<h3>
							{isSpecialUseFamily
								? 'Character use'
								: 'Languages and writing systems'}
						</h3>
						<p>{coverageDescription}</p>
						{!isSpecialUseFamily && familyLanguages.length > 0 ? (
							<SearchableLanguageList
								familyId={metadata.id}
								languages={familyLanguages}
							/>
						) : !registry &&
							!isSymbolFamily &&
							!isPunctuationFamily &&
							!isDigitalFamily ? (
							<p>{metadata.subsets.map(formatFontLabel).join(', ')}</p>
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
							in{' '}
							{metadata.styles.map(formatFontLabel).join(' and ').toLowerCase()}{' '}
							{metadata.styles.length === 1 ? 'style' : 'styles'}.
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
							<p>
								{variableUnavailable
									? 'Axis details are temporarily unavailable.'
									: 'This variable font does not publish axis details.'}
							</p>
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
							<p>
								Typographic behaviors that adjust character forms, spacing, and
								positioning. Availability can vary between files.
							</p>
							<SearchableFeatureList
								familyId={metadata.id}
								featureTags={featureTags}
							/>
						</div>
					)}
				</div>
			</section>

			{registry?.license && (
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
						<textarea
							className={classes.licenseText}
							aria-label={`${registry.license.id} license text`}
							readOnly
							spellCheck={false}
							value={registry.license.text}
						/>
					</div>
				</section>
			)}

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

				{technicalAvailabilityMessage && (
					<p className={classes.technicalNotice}>
						{technicalAvailabilityMessage}
					</p>
				)}

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
					{registry?.project?.revision && (
						<div>
							<dt>Revision</dt>
							<dd>
								<a
									href={`${repository.replace(/\/$/, '')}/tree/${registry.project.revision}`}
									target="_blank"
									rel="noreferrer"
								>
									<code>{registry.project.revision.slice(0, 10)}</code>
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
									mappedCharacterCount={
										source.sha256 === capabilitySource?.sha256
											? capabilities?.codepointCount
											: undefined
									}
								/>
							))}
						</ul>
					</div>
				)}
			</section>

			{registry?.replacedBy && (
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
