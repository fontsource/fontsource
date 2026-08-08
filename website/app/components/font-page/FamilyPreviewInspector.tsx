import { observer, useValue } from '@legendapp/state/react';
import {
	Drawer,
	NumberInput,
	SegmentedControl,
	Slider,
	Switch,
	VisuallyHidden,
} from '@mantine/core';
import { IconItalic, IconSearch } from '@tabler/icons-react';

import { IconRotate } from '@/components/icons';
import {
	getOpenTypeFeatureDescription,
	getOpenTypeFeatureName,
} from '@/utils/registry';

import classes from './FamilyPreview.module.css';
import { usePreviewEditor } from './FamilyPreviewContext';
import {
	clamp,
	enabledByDefaultFeatureTags,
	getActiveAxes,
	getActiveFeatureTags,
	getActiveSource,
	getAdjustableAxes,
	getAvailableWeights,
	modeLabels,
	type PreviewInspectorSection,
	resetAxes,
	resetCurrentTypography,
	resetFeatures,
	resetStyling,
	typographyMatches,
	updateCurrentTypography,
} from './FamilyPreviewState';

const exclusiveFeatureGroups = [
	['lnum', 'onum'],
	['pnum', 'tnum'],
	['subs', 'sups'],
] as const;

const formatNumber = (value: number) =>
	Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));

const formatPixels = (value: number) => `${formatNumber(value)} px`;

const normalizeSearchValue = (value: string) =>
	value.trim().toLowerCase().replace(/[_-]+/g, ' ');

const RangeControl = ({
	id,
	label,
	tag,
	description,
	value,
	min,
	max,
	step,
	onChange,
	formatValue = formatNumber,
	unit,
	marks,
	restrictToMarks = false,
	fixed = false,
}: {
	id: string;
	label: string;
	tag?: string;
	description?: string;
	value: number;
	min: number;
	max: number;
	step: number;
	onChange: (value: number) => void;
	formatValue?: (value: number) => string;
	unit?: string;
	marks?: Array<{ value: number }>;
	restrictToMarks?: boolean;
	fixed?: boolean;
}) => {
	const descriptionId = description ? `${id}-description` : undefined;
	const decimalScale = step < 1 ? String(step).split('.')[1]?.length : 0;
	const setValue = (nextValue: number) => {
		if (Number.isFinite(nextValue)) onChange(clamp(nextValue, min, max));
	};

	return (
		<div className={classes.rangeControl}>
			<div className={classes.rangeHeading}>
				<div className={classes.rangeCopy}>
					<div className={classes.rangeLabel}>
						<label htmlFor={`${id}-value`}>{label}</label>
						{tag && <code>{tag}</code>}
					</div>
					{description && (
						<p className={classes.controlDescription} aria-hidden="true">
							{description}
						</p>
					)}
				</div>
				{fixed ? (
					<output
						className={classes.fixedValue}
						aria-label={`${label}: ${formatValue(value)}`}
					>
						{formatValue(value)}
					</output>
				) : (
					<NumberInput
						id={`${id}-value`}
						className={classes.numberControl}
						classNames={{
							description: classes.inputDescription,
							input: classes.numberInput,
						}}
						description={description}
						descriptionProps={{ id: descriptionId }}
						value={value}
						min={min}
						max={max}
						step={step}
						decimalScale={decimalScale}
						suffix={unit ? ` ${unit}` : undefined}
						hideControls
						clampBehavior="strict"
						aria-valuemax={max}
						aria-valuemin={min}
						aria-valuenow={value}
						aria-valuetext={formatValue(value)}
						role="spinbutton"
						onChange={(nextValue) => {
							if (typeof nextValue === 'number') setValue(nextValue);
						}}
					/>
				)}
			</div>
			{!fixed && (
				<div className={classes.sliderGroup}>
					<Slider
						classNames={{ root: classes.slider, bar: classes.sliderBar }}
						color="purple.0"
						size="sm"
						thumbSize={20}
						thumbLabel={description ? `${label}. ${description}` : label}
						thumbValueText={(currentValue) => formatValue(currentValue)}
						label={formatValue}
						min={min}
						max={max}
						step={step}
						marks={marks}
						restrictToMarks={restrictToMarks}
						value={value}
						onChange={setValue}
					/>
					<div className={classes.rangeBounds} aria-hidden="true">
						<span>{formatValue(min)}</span>
						<span>{formatValue(max)}</span>
					</div>
				</div>
			)}
		</div>
	);
};

const InspectorSearch = ({
	label,
	placeholder,
	value,
	onChange,
}: {
	label: string;
	placeholder: string;
	value: string;
	onChange: (value: string) => void;
}) => (
	<label className={classes.inspectorSearch}>
		<IconSearch aria-hidden size={16} stroke={1.75} />
		<VisuallyHidden>{label}</VisuallyHidden>
		<input
			type="search"
			autoComplete="off"
			placeholder={placeholder}
			value={value}
			onChange={(event) => onChange(event.currentTarget.value)}
		/>
	</label>
);

const PreviewInspectorHeader = observer(
	({ embedded }: { embedded: boolean }) => {
		const model = usePreviewEditor();
		const mode = useValue(model.state$.mode);
		const inspectorSection = useValue(model.state$.inspectorSection);
		const typographyByMode = useValue(model.state$.typographyByMode);
		const axisValues = useValue(model.state$.axisValues);
		const featureValues = useValue(model.state$.featureValues);
		const adjustableAxes = useValue(() => getAdjustableAxes(model));
		const featureTags = useValue(() => getActiveFeatureTags(model));
		const changedTypographyModes = modeLabels.filter(
			({ value }) =>
				!typographyMatches(
					typographyByMode[value],
					model.initialTypography[value],
				),
		);
		const typographyChanged = changedTypographyModes.length > 0;
		const currentTypographyChanged = changedTypographyModes.some(
			({ value }) => value === mode,
		);
		const axesChanged = adjustableAxes.some(
			(axis) => (axisValues[axis.tag] ?? axis.default) !== axis.default,
		);
		const featuresChanged = featureTags.some(
			(tag) =>
				Boolean(featureValues[tag]) !== enabledByDefaultFeatureTags.has(tag),
		);
		const changedGroups = [
			typographyChanged,
			axesChanged,
			featuresChanged,
		].filter(Boolean).length;
		const showResetAll =
			changedGroups > 1 ||
			(typographyChanged &&
				(inspectorSection !== 'typography' ||
					!currentTypographyChanged ||
					changedTypographyModes.length > 1)) ||
			(axesChanged && inspectorSection !== 'axes') ||
			(featuresChanged && inspectorSection !== 'features');

		if (!embedded && !showResetAll) return null;

		return (
			<div
				className={embedded ? classes.inspectorHeading : classes.drawerReset}
			>
				{embedded && (
					<div>
						<h2>Preview settings</h2>
						<p>
							{model.familyKind === 'symbols'
								? 'Adjust how symbols appear in this preview.'
								: 'Adjust this view without changing the others.'}
						</p>
					</div>
				)}
				{showResetAll && (
					<button
						type="button"
						aria-label="Reset all preview settings"
						onClick={() => resetStyling(model)}
					>
						<IconRotate aria-hidden height={15} />
						Reset all settings
					</button>
				)}
			</div>
		);
	},
);

const PreviewTypographyControls = observer(
	({ idPrefix }: { idPrefix: string }) => {
		const model = usePreviewEditor();
		const mode = useValue(model.state$.mode);
		const typography = useValue(model.state$.typographyByMode[mode]);
		const activeAxes = useValue(() => getActiveAxes(model));
		const weightAxis = activeAxes.find((axis) => axis.tag === 'wght');
		const availableWeights = getAvailableWeights(model.metadata.weights);
		const weightMin = weightAxis?.min ?? Math.min(...availableWeights);
		const weightMax = weightAxis?.max ?? Math.max(...availableWeights);
		const changed = !typographyMatches(
			typography,
			model.initialTypography[mode],
		);

		return (
			<section className={classes.inspectorSection}>
				<div className={classes.sectionHeading}>
					<div>
						<h3>Typography</h3>
						<span>Size, weight, spacing, and style</span>
					</div>
					<button
						type="button"
						aria-label="Reset typography settings"
						disabled={!changed}
						onClick={() => resetCurrentTypography(model)}
					>
						Reset
					</button>
				</div>
				<RangeControl
					id={`${idPrefix}-size`}
					label="Font size"
					description="Sets the scale of this preview."
					value={typography.size}
					min={8}
					max={300}
					step={1}
					formatValue={formatPixels}
					unit="px"
					onChange={(size) => updateCurrentTypography(model, { size })}
				/>
				<RangeControl
					id={`${idPrefix}-weight`}
					label="Weight"
					description={
						weightMin === weightMax
							? 'This family provides one fixed weight.'
							: weightAxis
								? 'Fine-tunes the strokes from light to bold.'
								: 'Chooses an available weight from light to bold.'
					}
					value={typography.weight}
					min={weightMin}
					max={weightMax}
					step={weightAxis?.step ?? 1}
					marks={
						weightAxis
							? undefined
							: availableWeights.map((value) => ({ value }))
					}
					restrictToMarks={!weightAxis && availableWeights.length > 1}
					fixed={weightMin === weightMax}
					onChange={(weight) => updateCurrentTypography(model, { weight })}
				/>
				{model.metadata.styles.includes('italic') && (
					<div className={classes.segmentedField}>
						<div className={classes.rangeCopy}>
							<div className={classes.rangeLabel}>
								<span>Style</span>
							</div>
							<p
								id={`${idPrefix}-style-description`}
								className={classes.controlDescription}
							>
								Switches between upright and italic forms.
							</p>
						</div>
						<SegmentedControl
							fullWidth
							aria-label="Font style"
							aria-describedby={`${idPrefix}-style-description`}
							value={typography.italic ? 'italic' : 'normal'}
							data={[
								{ label: 'Normal', value: 'normal' },
								{
									label: (
										<span className={classes.italicLabel}>
											<IconItalic aria-hidden height={16} />
											Italic
										</span>
									),
									value: 'italic',
								},
							]}
							onChange={(value) =>
								updateCurrentTypography(model, { italic: value === 'italic' })
							}
						/>
					</div>
				)}
				{model.familyKind !== 'symbols' && (
					<>
						<RangeControl
							id={`${idPrefix}-tracking`}
							label="Letter spacing"
							description="Changes the space between characters."
							value={typography.tracking}
							min={-10}
							max={40}
							step={0.5}
							formatValue={formatPixels}
							unit="px"
							onChange={(tracking) =>
								updateCurrentTypography(model, { tracking })
							}
						/>
						<RangeControl
							id={`${idPrefix}-line-height`}
							label="Line height"
							description="Changes the vertical space between lines."
							value={Number(
								(typography.size * typography.lineHeight).toFixed(1),
							)}
							min={Number((typography.size * 0.75).toFixed(1))}
							max={Number((typography.size * 2).toFixed(1))}
							step={0.5}
							formatValue={formatPixels}
							unit="px"
							onChange={(value) =>
								updateCurrentTypography(model, {
									lineHeight: value / typography.size,
								})
							}
						/>
					</>
				)}
			</section>
		);
	},
);

const PreviewAxisControls = observer(({ idPrefix }: { idPrefix: string }) => {
	const model = usePreviewEditor();
	const adjustableAxes = useValue(() => getAdjustableAxes(model));
	const axisValues = useValue(model.state$.axisValues);
	const axisQuery = useValue(model.state$.axisQuery);
	if (!adjustableAxes.length) return null;
	const query = normalizeSearchValue(axisQuery);
	const filteredAxes = query
		? adjustableAxes.filter((axis) =>
				normalizeSearchValue(
					`${axis.name} ${axis.tag} ${axis.description ?? ''}`,
				).includes(query),
			)
		: adjustableAxes;
	const changed = adjustableAxes.some(
		(axis) => (axisValues[axis.tag] ?? axis.default) !== axis.default,
	);

	return (
		<section className={classes.inspectorSection}>
			<div className={classes.sectionHeading}>
				<div>
					<h3>Variable axes</h3>
					<span>
						{adjustableAxes.length}{' '}
						{adjustableAxes.length === 1
							? 'adjustable axis for this font'
							: 'adjustable axes for this font'}
					</span>
				</div>
				<button
					type="button"
					aria-label="Reset variable axes"
					disabled={!changed}
					onClick={() => resetAxes(model)}
				>
					Reset
				</button>
			</div>
			{adjustableAxes.length > 6 && (
				<InspectorSearch
					label="Search variable axes"
					placeholder="Search axes by name or tag"
					value={axisQuery}
					onChange={model.state$.axisQuery.set}
				/>
			)}
			<div className={classes.controlList}>
				{filteredAxes.map((axis) => (
					<RangeControl
						key={axis.tag}
						id={`${idPrefix}-axis-${axis.tag}`}
						label={axis.name}
						tag={axis.tag}
						description={axis.description}
						value={axisValues[axis.tag] ?? axis.default}
						min={axis.min}
						max={axis.max}
						step={axis.step}
						onChange={(value) =>
							model.state$.axisValues.set({
								...model.state$.axisValues.peek(),
								[axis.tag]: value,
							})
						}
					/>
				))}
				{filteredAxes.length === 0 && (
					<p className={classes.emptyState} role="status">
						No variable axes match “{axisQuery}”.
					</p>
				)}
			</div>
		</section>
	);
});

const PreviewFeatureControls = observer(() => {
	const model = usePreviewEditor();
	const featureTags = useValue(() => getActiveFeatureTags(model));
	const featureValues = useValue(model.state$.featureValues);
	const featureQuery = useValue(model.state$.featureQuery);
	const query = normalizeSearchValue(featureQuery);
	const filteredFeatures = query
		? featureTags.filter((tag) =>
				normalizeSearchValue(
					`${getOpenTypeFeatureName(tag)} ${tag} ${getOpenTypeFeatureDescription(tag)}`,
				).includes(query),
			)
		: featureTags;
	const changed = featureTags.some(
		(tag) =>
			Boolean(featureValues[tag]) !== enabledByDefaultFeatureTags.has(tag),
	);
	const toggleFeature = (tag: string) => {
		const values = model.state$.featureValues.peek();
		const enabled = !values[tag];
		const next = { ...values, [tag]: enabled };
		if (enabled) {
			for (const group of exclusiveFeatureGroups) {
				if (!(group as readonly string[]).includes(tag)) continue;
				for (const peer of group) {
					if (peer !== tag) next[peer] = false;
				}
			}
		}
		model.state$.featureValues.set(next);
	};
	const renderFeatureList = (tags: readonly string[]) => (
		<ul className={classes.featureList}>
			{tags.map((tag) => (
				<li key={tag}>
					<Switch
						className={classes.featureControl}
						classNames={{
							body: classes.featureSwitchBody,
							track: classes.featureSwitchTrack,
							labelWrapper: classes.featureText,
							label: classes.featureLabel,
							description: classes.featureDescription,
						}}
						label={
							<>
								<strong>{getOpenTypeFeatureName(tag)}</strong>
								<code>{tag}</code>
							</>
						}
						description={getOpenTypeFeatureDescription(tag)}
						labelPosition="left"
						checked={Boolean(featureValues[tag])}
						color="purple.0"
						size="sm"
						withThumbIndicator={false}
						onChange={() => toggleFeature(tag)}
					/>
				</li>
			))}
		</ul>
	);

	return (
		<section className={classes.inspectorSection}>
			<div className={classes.sectionHeading}>
				<div>
					<h3>OpenType features</h3>
					<span>Control ligatures, alternates, and number styles</span>
				</div>
				{featureTags.length > 0 && (
					<button
						type="button"
						aria-label="Reset OpenType features"
						disabled={!changed}
						onClick={() => resetFeatures(model)}
					>
						Reset
					</button>
				)}
			</div>
			{featureTags.length === 0 ? (
				<PreviewCapabilitiesStatus />
			) : (
				<>
					{featureTags.length > 8 && (
						<InspectorSearch
							label="Search OpenType features"
							placeholder={`Search ${featureTags.length} features`}
							value={featureQuery}
							onChange={model.state$.featureQuery.set}
						/>
					)}
					{filteredFeatures.length > 0 && renderFeatureList(filteredFeatures)}
				</>
			)}
			{query && filteredFeatures.length === 0 && (
				<p className={classes.emptyState} role="status">
					No OpenType features match “{featureQuery}”.
				</p>
			)}
		</section>
	);
});

const PreviewCapabilitiesStatus = observer(() => {
	const model = usePreviewEditor();
	const activeSource = useValue(() => getActiveSource(model));
	const capabilitiesBySource = useValue(model.state$.capabilitiesBySource);
	if (!activeSource) return null;
	const cached = Object.hasOwn(capabilitiesBySource, activeSource.sha256);
	if (!cached) {
		return (
			<p className={classes.capabilitiesStatus} role="status">
				Loading OpenType features for this style…
			</p>
		);
	}
	if (capabilitiesBySource[activeSource.sha256] !== null) return null;

	return (
		<div className={classes.capabilitiesStatus} role="status">
			<span>OpenType features couldn’t load.</span>
			<button
				type="button"
				onClick={() => {
					const next = { ...model.state$.capabilitiesBySource.peek() };
					delete next[activeSource.sha256];
					model.state$.capabilitiesBySource.set(next);
				}}
			>
				Try again
			</button>
		</div>
	);
});

const PreviewInspector = observer(
	({ idPrefix, embedded }: { idPrefix: string; embedded: boolean }) => {
		const model = usePreviewEditor();
		const inspectorSection = useValue(model.state$.inspectorSection);
		const adjustableAxes = useValue(() => getAdjustableAxes(model));
		const featureTags = useValue(() => getActiveFeatureTags(model));
		const activeSource = useValue(() => getActiveSource(model));
		const capabilitiesBySource = useValue(model.state$.capabilitiesBySource);
		const activeCapabilitiesCached = activeSource
			? Object.hasOwn(capabilitiesBySource, activeSource.sha256)
			: true;
		const activeCapabilities = activeSource
			? capabilitiesBySource[activeSource.sha256]
			: model.capabilities;
		const featureCapabilitiesUnresolved = Boolean(
			activeSource &&
				(!activeCapabilitiesCached || activeCapabilities === null),
		);
		const showFeatureSection =
			model.familyKind !== 'symbols' &&
			(featureTags.length > 0 || featureCapabilitiesUnresolved);
		const sections: Array<{
			label: string;
			value: PreviewInspectorSection;
		}> = [
			{ label: 'Typography', value: 'typography' },
			...(adjustableAxes.length
				? [{ label: 'Variable', value: 'axes' as const }]
				: []),
			...(showFeatureSection
				? [{ label: 'Features', value: 'features' as const }]
				: []),
		];
		const activeSection = sections.some(
			(section) => section.value === inspectorSection,
		)
			? inspectorSection
			: 'typography';

		return (
			<div className={classes.inspectorContent}>
				<PreviewInspectorHeader embedded={embedded} />
				{sections.length > 1 && (
					<div className={classes.inspectorSectionChooser}>
						<SegmentedControl
							fullWidth
							aria-label="Settings section"
							value={activeSection}
							data={sections}
							onChange={(value) =>
								model.state$.inspectorSection.set(
									value as PreviewInspectorSection,
								)
							}
						/>
					</div>
				)}
				{activeSection === 'typography' && (
					<PreviewTypographyControls idPrefix={idPrefix} />
				)}
				{activeSection === 'axes' && (
					<PreviewAxisControls idPrefix={idPrefix} />
				)}
				{activeSection === 'features' && <PreviewFeatureControls />}
			</div>
		);
	},
);

const PreviewDrawer = observer(() => {
	const model = usePreviewEditor();
	const opened = useValue(model.state$.inspectorOpened);
	return (
		<Drawer
			opened={opened}
			onClose={() => model.state$.inspectorOpened.set(false)}
			position="bottom"
			size="min(50dvh, 460px)"
			title="Preview settings"
			closeButtonProps={{ 'aria-label': 'Close preview settings' }}
			overlayProps={{ backgroundOpacity: 0.12, blur: 0 }}
			classNames={{
				content: classes.drawerContent,
				header: classes.drawerHeader,
				body: classes.drawerBody,
			}}
		>
			<PreviewInspector idPrefix="mobile-preview" embedded={false} />
		</Drawer>
	);
});

export { PreviewDrawer, PreviewInspector };
