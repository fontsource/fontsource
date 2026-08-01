import { Link } from 'react-router';

import type {
	GetFontResponse,
	GetRegistrySourceCapabilitiesResponse,
	GetRegistryTaxonomyResponse,
	GetVariableFontResponse,
	ListRegistryAxesResponse,
	ListRegistryLanguagesResponse,
} from '@/generated/api';
import { getFontFamilyStack } from '@/utils/font-preview';
import {
	getOpenTypeFeatureName,
	hasSymbolCatalog,
	isDigitalFontFamily,
	isPunctuationFontFamily,
	isSymbolFontFamily,
	type RegistryFamily,
	type RegistrySource,
	usesNameLigatures,
} from '@/utils/registry';

import classes from './FamilyAbout.module.css';
import { LicenseReceipt } from './LicenseReceipt';

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

const humanize = (value: string) =>
	value
		.split(/[-_/]/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');

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

const getLocalizedContent = (registry?: RegistryFamily) => {
	const content = registry?.content;
	if (!content) return;
	const entries = Object.entries(content);
	return (
		entries.find(([locale]) => locale.toLowerCase().startsWith('en'))?.[1] ??
		entries[0]?.[1]
	);
};

const cleanMarkdown = (value: string) =>
	value
		.replace(/!\[[^\]]*\]\([^)]+\)/g, '')
		.replace(/\*\*|__/g, '')
		.replace(/(^|\s)\*([^*]+)\*/g, '$1$2')
		.trim();

const renderInlineMarkdown = (value: string) => {
	const nodes: React.ReactNode[] = [];
	const expression = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
	let cursor = 0;
	let match = expression.exec(value);

	while (match) {
		const [source, label, url] = match;
		if (match.index > cursor) {
			nodes.push(cleanMarkdown(value.slice(cursor, match.index)));
		}
		nodes.push(
			<a
				key={`${url}-${match.index}`}
				href={url}
				target="_blank"
				rel="noreferrer"
			>
				{label}
			</a>,
		);
		cursor = match.index + source.length;
		match = expression.exec(value);
	}

	if (cursor < value.length) nodes.push(cleanMarkdown(value.slice(cursor)));
	return nodes;
};

const MarkdownContent = ({ value }: { value: string }) => (
	<>
		{value
			.split(/\n{2,}/)
			.map((block) => block.trim())
			.filter((block) => block && !/^(?:\*\s*){3}$/.test(block))
			.map((block) => {
				const withoutImages = block.replace(/!\[[^\]]*\]\([^)]+\)/g, '').trim();
				if (!withoutImages) return null;
				const heading = withoutImages.match(/^#{2,4}\s+(.+)$/s);
				if (heading) {
					return (
						<h3 key={withoutImages}>{renderInlineMarkdown(heading[1])}</h3>
					);
				}
				return (
					<p key={withoutImages}>
						{renderInlineMarkdown(withoutImages.replaceAll('\n', ' '))}
					</p>
				);
			})}
	</>
);

const getSpecimen = (metadata: GetFontResponse, registry?: RegistryFamily) => {
	return (
		registry?.sampleText?.styles ??
		registry?.sampleText?.tester ??
		metadata.family
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
	registryUnavailable = false,
	enrichmentUnavailable = false,
	capabilitiesUnavailable = false,
	variableUnavailable = false,
}: FamilyAboutProps) => {
	const hasCatalog = hasSymbolCatalog(registry);
	const hasNamedLigatures = usesNameLigatures(registry);
	const isSymbolFamily = isSymbolFontFamily(registry);
	const isPunctuationFamily = isPunctuationFontFamily(registry);
	const isDigitalFamily = isDigitalFontFamily(registry);
	const content = getLocalizedContent(registry);
	const description =
		content?.description ??
		`${metadata.family} is an open-source ${humanize(metadata.category).toLowerCase()} family distributed by Fontsource.`;
	const article =
		content?.article && content.article !== content.description
			? content.article.startsWith(content.description ?? '')
				? content.article.slice(content.description?.length ?? 0)
				: content.article
			: undefined;
	const fontFamily = getFontFamilyStack(metadata, Boolean(variable), registry);
	const specimenStyle = {
		fontFamily,
		fontFeatureSettings: hasNamedLigatures ? '"liga"' : undefined,
	};
	const classifications = registry?.classifications.map(
		(value) => taxonomy?.classifications[value]?.label ?? humanize(value),
	) ?? [humanize(metadata.category)];
	const tags =
		registry?.tags.map((id) => ({
			id,
			label: taxonomy?.tags[id]?.label ?? humanize(id),
		})) ?? [];
	const familyLanguages =
		languages?.filter((language) =>
			registry?.languages.includes(language.id),
		) ?? [];
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
	return (
		<section className={classes.page} aria-labelledby="about-heading">
			<style
				// biome-ignore lint/security/noDangerouslySetInnerHtml: Generated from owned font metadata.
				dangerouslySetInnerHTML={{ __html: variableCSS ?? staticCSS }}
			/>

			{(registryUnavailable ||
				enrichmentUnavailable ||
				capabilitiesUnavailable ||
				variableUnavailable) && (
				<p className={classes.availabilityNotice} role="status">
					{registryUnavailable
						? 'The family registry record is temporarily unavailable. Package facts and download options remain available.'
						: capabilitiesUnavailable
							? 'Exact source capabilities are temporarily unavailable. Family, package, and license information remain available.'
							: variableUnavailable
								? 'Variable-axis details are temporarily unavailable. Static preview and package facts remain available.'
								: 'Some supporting registry details are temporarily unavailable. The family record and registry license remain available.'}
				</p>
			)}

			<div className={classes.intro}>
				<div className={classes.story}>
					<p className={classes.kicker}>About this family</p>
					<h2 id="about-heading">{metadata.family}, in context.</h2>
					<div className={classes.prose}>
						<MarkdownContent value={description} />
					</div>
					<div
						className={classes.specimen}
						style={specimenStyle}
						data-category={metadata.category}
						role="img"
						aria-label={`${metadata.family} letter sample`}
					>
						{getSpecimen(metadata, registry)}
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
					registryUnavailable={registryUnavailable}
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
						<MarkdownContent value={article} />
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
						<p>
							{hasCatalog
								? hasNamedLigatures
									? 'This family provides a verified catalog of named symbol ligatures and their Unicode mappings.'
									: 'This family provides a verified catalog of mapped symbols.'
								: isPunctuationFamily
									? 'This family is designed to replace and space Japanese punctuation alongside another Japanese text font.'
									: isDigitalFamily
										? 'This family is designed for numerical readouts and compact display labels.'
										: isSymbolFamily
											? 'This family is intended for mapped symbols rather than running language text.'
											: primaryLanguage
												? `${primaryLanguage.preferredName ?? primaryLanguage.name} is the primary language.`
												: registry?.primaryScript
													? `${registry.primaryScript} is the primary script.`
													: registry
														? 'The registry does not list semantic language coverage for this family.'
														: 'Registry language details are unavailable. The package subsets below describe downloadable character sets, not exact language support.'}
						</p>
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
							<p>{metadata.subsets.map(humanize).join(', ')}</p>
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
							{metadata.styles.map(humanize).join(', ')}
						</p>
						{axes.length > 0 ? (
							<dl className={classes.axisList}>
								{axes.map(([axis, range]) => {
									const definition = axisRegistry?.[axis];
									return (
										<div key={axis}>
											<dt>
												{definition?.name ?? humanize(axis)}
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
										? humanize(registry.provider)
										: humanize(metadata.type)}
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
										<strong>{humanize(registry.replacedBy)}</strong>
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
