import { Link } from 'react-router';

import type {
	GetFontResponse,
	GetRegistrySourceCapabilitiesResponse,
	GetRegistryTaxonomyResponse,
	GetVariableFontResponse,
	ListRegistryAxesResponse,
	ListRegistryLanguagesResponse,
} from '@/generated/api';
import { formatFontLabel, getAxisLabel } from '@/utils/font-labels';
import { getFontFamilyStack } from '@/utils/font-preview';
import {
	getOpenTypeFeatureName,
	getRegistryContent,
	getRegistryFamilyKind,
	type RegistryFamily,
	type RegistrySource,
	usesNameLigatures,
} from '@/utils/registry';

import classes from './FamilyAbout.module.css';
import { LicenseReceipt } from './LicenseReceipt';
import { RegistryMarkdown } from './RegistryMarkdown';

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
	registryUnavailable?: boolean;
	enrichmentUnavailable?: boolean;
	capabilitiesUnavailable?: boolean;
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

const getRegistryAssetUrl = (value: string) =>
	new URL(value, 'https://api.fontsource.org').toString();

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
	registryUnavailable = false,
	enrichmentUnavailable = false,
	capabilitiesUnavailable = false,
	variableUnavailable = false,
}: FamilyAboutProps) => {
	const hasCatalog = Boolean(registry?.symbols);
	const hasNamedLigatures = usesNameLigatures(registry);
	const familyKind = getRegistryFamilyKind(registry);
	const isSymbolFamily = familyKind === 'symbols';
	const isPunctuationFamily = familyKind === 'punctuation';
	const isDigitalFamily = familyKind === 'digital';
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
	const primaryLanguage = familyLanguages.find(
		(language) => language.id === registry?.primaryLanguage,
	);
	const axes = Object.entries(variable?.axes ?? {});
	const sources = registry?.sources ?? [];
	const sourceFormats = Array.from(
		new Set(sources.map((source) => source.format.toUpperCase())),
	);
	const repository = registry?.project?.repository ?? metadata.source;
	const updated = formatDate(registry?.sourceModified ?? metadata.lastModified);
	const totalSourceSize = sources.reduce(
		(total, source) => total + source.size,
		0,
	);
	const colorTables = capabilities?.colorTables ?? [];
	const featureTags = capabilities
		? Array.from(
				new Set([...capabilities.features.gsub, ...capabilities.features.gpos]),
			).sort()
		: [];
	let availabilityMessage: string | undefined;
	if (registryUnavailable) {
		availabilityMessage =
			'The family registry record is temporarily unavailable. Package facts and download options remain available.';
	} else if (capabilitiesUnavailable) {
		availabilityMessage =
			'Exact source capabilities are temporarily unavailable. Family, package, and license information remain available.';
	} else if (variableUnavailable) {
		availabilityMessage =
			'Variable-axis details are temporarily unavailable. Static preview and package facts remain available.';
	} else if (enrichmentUnavailable) {
		availabilityMessage =
			'Some supporting registry details are temporarily unavailable. The family record and registry license remain available.';
	}
	let coverageDescription =
		'Registry language details are unavailable. The package subsets below describe downloadable character sets, not exact language support.';
	if (hasCatalog) {
		coverageDescription = hasNamedLigatures
			? 'This family provides a verified catalog of named symbol ligatures and their Unicode mappings.'
			: 'This family provides a verified catalog of mapped symbols.';
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
		coverageDescription = `${primaryLanguage.preferredName ?? primaryLanguage.name} is the primary language.`;
	} else if (registry?.primaryScript) {
		coverageDescription = `${registry.primaryScript} is the primary script.`;
	} else if (registry) {
		coverageDescription =
			'The registry does not list semantic language coverage for this family.';
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
					<p className={classes.kicker}>About this family</p>
					<h2 id="about-heading">{metadata.family}, in context.</h2>
					<div className={classes.prose}>
						<RegistryMarkdown value={description} />
					</div>
					<div
						className={classes.specimen}
						style={specimenStyle}
						data-category={metadata.category}
						role="img"
						aria-label={`${metadata.family} letter sample`}
					>
						{registry?.sampleText?.short ?? metadata.family}
					</div>
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
						<dt>Languages</dt>
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
												? `${registry.languages.length.toLocaleString('en')} supported`
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
					{registry?.license.id && (
						<div>
							<dt>License</dt>
							<dd>{registry.license.id} · verified</dd>
						</div>
					)}
				</dl>
			</div>

			<div className={classes.licenseBlock}>
				<LicenseReceipt
					familyId={metadata.id}
					family={metadata.family}
					license={registry?.license}
					variant="detail"
				/>
			</div>

			{tags.length > 0 && (
				<section className={classes.taxonomy} aria-labelledby="tags-heading">
					<div>
						<h2 id="tags-heading">How the registry describes it</h2>
						<p>Reviewed categories and visual characteristics.</p>
					</div>
					<ul>
						{tags.map((tag) => (
							<li key={tag.id}>
								<Link to={`/?query=${encodeURIComponent(tag.label)}`}>
									{tag.label}
								</Link>
							</li>
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
						<h2 id="coverage-heading">Coverage and capabilities</h2>
						<p>
							What the registry and published packages say this family supports.
						</p>
					</div>
					<Link to={`/fonts/${metadata.id}/glyphs`}>Explore glyphs →</Link>
				</div>

				<div className={classes.capabilityGrid}>
					<div>
						<h3>Languages and scripts</h3>
						<p>{coverageDescription}</p>
						{familyLanguages.length > 0 ? (
							<ul className={classes.languageList}>
								{familyLanguages.slice(0, 6).map((language) => (
									<li key={language.id}>
										{language.preferredName ?? language.name}
										{language.autonym &&
											language.autonym !== language.name &&
											` · ${language.autonym}`}
									</li>
								))}
							</ul>
						) : !registry &&
							!isSymbolFamily &&
							!isPunctuationFamily &&
							!isDigitalFamily ? (
							<p>{metadata.subsets.map(formatFontLabel).join(', ')}</p>
						) : null}
						{familyLanguages.length > 6 && (
							<p className={classes.more}>
								+{(registry?.languages.length ?? familyLanguages.length) - 6}{' '}
								more languages
							</p>
						)}
					</div>

					<div>
						<h3>Styles and axes</h3>
						<p>
							{metadata.weights.length} weights ·{' '}
							{metadata.styles.map(formatFontLabel).join(', ')}
						</p>
						{axes.length > 0 ? (
							<dl className={classes.axisList}>
								{axes.map(([axis, range]) => {
									const definition = axisRegistry?.[axis];
									return (
										<div key={axis}>
											<dt>
												{definition?.name ?? getAxisLabel(axis)}
												<code>{axis}</code>
											</dt>
											<dd>
												{definition?.description && (
													<span>{definition.description}</span>
												)}
												<code>
													{range.min}–{range.max}
												</code>
											</dd>
										</div>
									);
								})}
							</dl>
						) : metadata.variable ? (
							<p>Variable-axis details are temporarily unavailable.</p>
						) : (
							<p>This release contains static font files.</p>
						)}
						{featureTags.length > 0 && (
							<div className={classes.featureSummary}>
								<strong>
									OpenType features in{' '}
									{capabilitySource?.filename ?? 'the selected source'}
								</strong>
								<ul className={classes.featureList}>
									{featureTags.slice(0, 8).map((tag) => (
										<li key={tag} title={tag}>
											{getOpenTypeFeatureName(tag)}
											<code>{tag}</code>
										</li>
									))}
								</ul>
								{featureTags.length > 8 && (
									<p className={classes.more}>
										+{featureTags.length - 8} more detected features
									</p>
								)}
								<p>
									Feature availability can vary by source, script, and language.
								</p>
							</div>
						)}
					</div>
				</div>
			</section>

			<details className={classes.technical}>
				<summary>
					<span className={classes.technicalLabel}>
						<strong>Technical details</strong>
						<small>Source files, provenance, and related families</small>
					</span>
					<span className={classes.disclosureIcon} aria-hidden="true" />
				</summary>
				<div className={classes.technicalContent}>
					<section
						className={classes.provenance}
						aria-labelledby="source-heading"
					>
						<div className={classes.sectionHeading}>
							<div>
								<h2 id="source-heading">Source and provenance</h2>
								<p>
									Where the files came from and what Fontsource distributes.
								</p>
							</div>
							<a href={repository} target="_blank" rel="noreferrer">
								View upstream project →
							</a>
						</div>

						<dl className={classes.sourceSummary}>
							<div>
								<dt>Provider</dt>
								<dd>
									{registry
										? formatFontLabel(registry.provider)
										: formatFontLabel(metadata.type)}
								</dd>
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
							{totalSourceSize > 0 && (
								<div>
									<dt>Source size</dt>
									<dd>{(totalSourceSize / 1024 / 1024).toFixed(1)} MB</dd>
								</div>
							)}
							{capabilitySource && capabilities && (
								<div>
									<dt>Selected capability source</dt>
									<dd>{capabilitySource.filename}</dd>
								</div>
							)}
							{capabilities && (
								<div>
									<dt>Selected source outline</dt>
									<dd>{capabilities.outline.toUpperCase()}</dd>
								</div>
							)}
							{capabilities && (
								<div>
									<dt>Selected source cmap</dt>
									<dd>
										{capabilities.codepointCount.toLocaleString('en')}{' '}
										codepoints
									</dd>
								</div>
							)}
							{colorTables.length > 0 && (
								<div>
									<dt>Sample color tables</dt>
									<dd>{colorTables.join(', ')}</dd>
								</div>
							)}
						</dl>

						{sources.length > 0 && (
							<details className={classes.sourceFiles}>
								<summary>Inspect source files</summary>
								<ul>
									{sources.slice(0, 12).map((source) => (
										<li key={source.sha256}>
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
													{source.type} · {source.format.toUpperCase()} ·{' '}
													{source.style} · {(source.size / 1024).toFixed(0)} KB
													{source.sha256 === capabilitySource?.sha256 &&
													capabilities
														? ` · ${capabilities.codepointCount.toLocaleString('en')} codepoints`
														: ''}
												</span>
											</div>
											<code>{source.sha256.slice(0, 12)}…</code>
										</li>
									))}
								</ul>
								{sources.length > 12 && (
									<p>Showing 12 of {sources.length} source files.</p>
								)}
							</details>
						)}
					</section>

					{registry?.replacedBy && (
						<section
							className={classes.related}
							aria-labelledby="related-heading"
						>
							<div className={classes.sectionHeading}>
								<div>
									<h2 id="related-heading">Related families</h2>
									<p>
										The registry recommends a maintained successor for this
										family.
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
				</div>
			</details>
		</section>
	);
};
