import { batch } from '@legendapp/state';
import { observer, useValue } from '@legendapp/state/react';
import { SegmentedControl, VisuallyHidden } from '@mantine/core';
import {
	IconAdjustmentsHorizontal,
	IconAlignCenter,
	IconAlignLeft,
	IconAlignRight,
} from '@tabler/icons-react';
import type { CSSProperties } from 'react';

import { DropdownSimple } from '@/components/Dropdown';
import {
	getFontFamilyStack,
	getFontPreviewFamily,
	getPreviewDirection,
	getPreviewLanguageTag,
	registrySourcePreviewFamily,
} from '@/utils/font-preview';
import { usesNameLigatures } from '@/utils/registry';

import classes from './FamilyPreview.module.css';
import { usePreviewEditor } from './FamilyPreviewContext';
import { PreviewCoverage } from './FamilyPreviewCoverage';
import {
	createLanguageModeTexts,
	getActiveFeatureTags,
	getActiveLanguages,
	getActiveSource,
	getAvailableWeights,
	modeLabels,
	updateCurrentTypography,
} from './FamilyPreviewState';
import { FontSkeleton } from './FontSkeleton';

const symbolModeLabels = [{ label: 'Symbols', value: 'headline' as const }];

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

const rtlScripts = new Set([
	'Adlm',
	'Arab',
	'Hebr',
	'Mand',
	'Nkoo',
	'Samr',
	'Syrc',
	'Thaa',
]);

const PreviewToolbar = observer(() => {
	const model = usePreviewEditor();
	const mode = useValue(model.state$.mode);
	const alignment = useValue(model.state$.typographyByMode[mode].alignment);
	const selectedLanguageId = useValue(model.state$.selectedLanguageId);
	const verifiedLanguages = useValue(() => getActiveLanguages(model));
	const selectedLanguage = verifiedLanguages.find(
		(language) => language.id === selectedLanguageId,
	);
	const previewDirection = selectedLanguage
		? rtlScripts.has(selectedLanguage.script)
			? 'rtl'
			: 'ltr'
		: getPreviewDirection(model.previewSubset);
	const StartAlignmentIcon =
		previewDirection === 'rtl' ? IconAlignRight : IconAlignLeft;
	const EndAlignmentIcon =
		previewDirection === 'rtl' ? IconAlignLeft : IconAlignRight;
	const alignmentOptions = [
		['start', 'Align text to start', StartAlignmentIcon],
		['center', 'Center text', IconAlignCenter],
		['end', 'Align text to end', EndAlignmentIcon],
	] as const;
	const activeModeLabels =
		model.familyKind === 'symbols' ? symbolModeLabels : modeLabels;
	const languageItems = verifiedLanguages.map((language) => ({
		label:
			language.autonym && language.autonym !== language.name
				? `${language.preferredName ?? language.name} · ${language.autonym}`
				: (language.preferredName ?? language.name),
		value: language.id,
		isRefined: language.id === selectedLanguageId,
	}));
	const selectLanguage = (languageId: string) => {
		const language = verifiedLanguages.find((item) => item.id === languageId);
		if (!language?.sampleText) return;
		const texts = createLanguageModeTexts(language);
		batch(() => {
			model.state$.selectedLanguageId.set(language.id);
			model.state$.texts.set(texts);
			model.state$.sampleTexts.set(texts);
		});
	};
	const openSettings = () => {
		document
			.getElementById(`font-preview-${mode}-text`)
			?.scrollIntoView({ block: 'start' });
		model.state$.inspectorOpened.set(true);
	};

	return (
		<div
			className={`${classes.specimenToolbar} ${
				model.familyKind === 'symbols' ? classes.symbolToolbar : ''
			}`}
		>
			{activeModeLabels.length > 1 && (
				<SegmentedControl
					className={classes.modeChooser}
					aria-label="Preview view"
					value={mode}
					data={activeModeLabels}
					onChange={(value) => model.state$.mode.set(value as typeof mode)}
				/>
			)}
			<div className={classes.toolbarActions}>
				{model.familyKind === 'text' && verifiedLanguages.length > 0 && (
					<div className={classes.languageControl}>
						<DropdownSimple
							label={
								selectedLanguage?.preferredName ??
								selectedLanguage?.name ??
								'Language'
							}
							ariaLabel="Preview language"
							items={languageItems}
							searchable={verifiedLanguages.length > 6}
							refine={selectLanguage}
							w="100%"
							dropdownWidth={280}
						/>
					</div>
				)}
				{model.familyKind !== 'symbols' && (
					<fieldset className={classes.alignmentControl}>
						<VisuallyHidden component="legend">
							Preview text alignment
						</VisuallyHidden>
						{alignmentOptions.map(([value, label, Icon]) => (
							<button
								key={value}
								type="button"
								aria-label={label}
								aria-pressed={alignment === value}
								onClick={() =>
									updateCurrentTypography(model, { alignment: value })
								}
							>
								<Icon aria-hidden size={17} stroke={1.8} />
							</button>
						))}
					</fieldset>
				)}
				<button
					type="button"
					className={classes.adjustButton}
					onClick={openSettings}
				>
					<IconAdjustmentsHorizontal aria-hidden size={18} stroke={1.8} />
					Settings
				</button>
			</div>
		</div>
	);
});

const PreviewCanvas = observer(() => {
	const model = usePreviewEditor();
	const mode = useValue(model.state$.mode);
	const activeText = useValue(model.state$.texts[mode]);
	const sampleText = useValue(model.state$.sampleTexts[mode]);
	const typography = useValue(model.state$.typographyByMode[mode]);
	const axisValues = useValue(model.state$.axisValues);
	const featureValues = useValue(model.state$.featureValues);
	const selectedLanguageId = useValue(model.state$.selectedLanguageId);
	const activeSource = useValue(() => getActiveSource(model));
	const featureTags = useValue(() => getActiveFeatureTags(model));
	const verifiedLanguages = useValue(() => getActiveLanguages(model));
	const availableWeights = getAvailableWeights(model.metadata.weights);
	const selectedLanguage = verifiedLanguages.find(
		(language) => language.id === selectedLanguageId,
	);
	const packagePreviewFamily = getFontPreviewFamily(
		model.metadata,
		Boolean(model.variable),
	);
	const activePreviewFamily = activeSource
		? `${registrySourcePreviewFamily} ${activeSource.sha256.slice(0, 12)}`
		: packagePreviewFamily;
	const fontFamily = activeSource
		? `${JSON.stringify(activePreviewFamily)}, "Fallback Outline"`
		: getFontFamilyStack(
				model.metadata,
				Boolean(model.variable),
				model.registry,
			);
	const previewDirection = selectedLanguage
		? rtlScripts.has(selectedLanguage.script)
			? 'rtl'
			: 'ltr'
		: getPreviewDirection(model.previewSubset);
	const previewLanguage = getPreviewLanguageTag(selectedLanguage);
	const hasNamedLigatures = usesNameLigatures(model.registry);
	const featureSettings = [
		...featureTags.map((tag) => `"${tag}" ${featureValues[tag] ? 1 : 0}`),
		...(hasNamedLigatures && !featureTags.includes('liga') ? ['"liga" 1'] : []),
	].join(', ');
	const variationSettings = Object.entries(axisValues)
		.map(([axis, value]) => `"${axis}" ${value}`)
		.join(', ');
	const previewStyle = {
		'--preview-size': `${typography.size}px`,
		fontFamily,
		fontWeight: typography.weight,
		fontStyle: typography.italic ? 'italic' : 'normal',
		letterSpacing: `${typography.tracking}px`,
		lineHeight: typography.lineHeight,
		textAlign: typography.alignment,
		fontFeatureSettings: featureSettings || undefined,
		fontVariationSettings: variationSettings || undefined,
	} as CSSProperties;
	const editorLabel =
		model.familyKind === 'symbols'
			? hasNamedLigatures
				? 'Symbol name or character'
				: 'Symbol character'
			: mode === 'headline'
				? 'Headline text'
				: mode === 'paragraph'
					? 'Paragraph text'
					: mode === 'waterfall'
						? 'Sample across sizes'
						: 'Text to compare';
	const textInputId = `font-preview-${mode}-text`;
	const sampleChanged = activeText !== sampleText;
	const setActiveText = (text: string) => model.state$.texts[mode].set(text);
	const editorHeader = (
		<div className={classes.editorHeader}>
			<label htmlFor={textInputId}>{editorLabel}</label>
			{sampleChanged && (
				<button type="button" onClick={() => setActiveText(sampleText)}>
					Restore sample
				</button>
			)}
		</div>
	);

	const content = (() => {
		if (mode === 'waterfall') {
			const sizes = Array.from(
				new Set(
					[1, 0.72, 0.48, 0.3].map((scale) =>
						Math.max(12, Math.round(typography.size * scale)),
					),
				),
			);
			return (
				<div
					className={classes.derivedCanvas}
					dir={previewDirection}
					lang={previewLanguage}
				>
					<div className={classes.derivedEditor}>
						{editorHeader}
						<input
							id={textInputId}
							type="text"
							value={activeText.replaceAll('\n', ' ')}
							spellCheck={false}
							onChange={(event) => setActiveText(event.currentTarget.value)}
						/>
						<PreviewCoverage />
					</div>
					<div className={classes.waterfall}>
						{sizes.map((previewSize) => (
							<div key={previewSize}>
								<span>{previewSize}</span>
								<p style={{ ...previewStyle, fontSize: previewSize }}>
									{activeText}
								</p>
							</div>
						))}
					</div>
				</div>
			);
		}

		if (mode === 'compare') {
			return (
				<div
					className={classes.derivedCanvas}
					dir={previewDirection}
					lang={previewLanguage}
				>
					<div className={classes.derivedEditor}>
						{editorHeader}
						<input
							id={textInputId}
							type="text"
							value={activeText.replaceAll('\n', ' ')}
							spellCheck={false}
							onChange={(event) => setActiveText(event.currentTarget.value)}
						/>
						<PreviewCoverage />
					</div>
					<FontSkeleton
						name="font-detail-weight-strip"
						family={packagePreviewFamily}
						weights={availableWeights}
						className={classes.compareSkeleton}
					>
						<div className={classes.compareGrid}>
							{availableWeights.map((value) => (
								<button
									key={value}
									type="button"
									data-active={typography.weight === value || undefined}
									aria-pressed={typography.weight === value}
									onClick={() =>
										updateCurrentTypography(model, { weight: value })
									}
								>
									<span>
										{weightNames[value] ?? 'Weight'} {value}
									</span>
									<strong
										style={{
											...previewStyle,
											fontFamily: getFontFamilyStack(
												model.metadata,
												Boolean(model.variable),
												model.registry,
											),
											fontWeight: value,
											fontSize: typography.size,
										}}
									>
										{activeText}
									</strong>
								</button>
							))}
						</div>
					</FontSkeleton>
				</div>
			);
		}

		return (
			<div className={classes.canvasField} data-mode={mode}>
				{editorHeader}
				<textarea
					id={textInputId}
					className={classes.canvas}
					rows={mode === 'paragraph' ? 6 : 3}
					style={previewStyle}
					dir={previewDirection}
					lang={previewLanguage}
					value={activeText}
					spellCheck={false}
					onChange={(event) => setActiveText(event.currentTarget.value)}
				/>
				<PreviewCoverage />
			</div>
		);
	})();

	return (
		<FontSkeleton
			name="font-detail-canvas"
			family={activePreviewFamily}
			weight={typography.weight}
			style={typography.italic ? 'italic' : 'normal'}
			className={classes.canvasSkeleton}
		>
			{content}
		</FontSkeleton>
	);
});

export { PreviewCanvas, PreviewToolbar };
