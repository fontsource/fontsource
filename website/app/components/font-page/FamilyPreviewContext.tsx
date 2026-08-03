import { batch } from '@legendapp/state';
import { observer, useObservable, useValue } from '@legendapp/state/react';
import { useIsomorphicEffect } from '@mantine/hooks';
import {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useMemo,
	useRef,
} from 'react';

import type { GetRegistrySourceCapabilitiesResponse } from '@/generated/api';
import {
	getFontPreviewFamily,
	getRegistrySourcePreviewCSS,
	registrySourcePreviewFamily,
} from '@/utils/font-preview';
import {
	type FontPreviewSelection,
	saveFontPreviewSelection,
} from '@/utils/font-preview-selection';

import classes from './FamilyPreview.module.css';
import {
	clamp,
	createLanguageModeTexts,
	createPreviewEditorSetup,
	enabledByDefaultFeatureTags,
	getActiveAxes,
	getActiveFeatureTags,
	getActiveLanguages,
	getActiveSource,
	getAdjustableAxes,
	getAvailableWeights,
	getPreferredLanguage,
	getVerifiedLanguages,
	modeLabels,
	type PreviewEditorModel,
	type PreviewEditorProps,
} from './FamilyPreviewState';

const PreviewEditorContext = createContext<PreviewEditorModel | null>(null);
const capabilitiesTimeoutMs = 12_000;
const previewSelectionSaveDelayMs = 160;
const compactPreviewQuery = '(max-width: 48em)';
const compactHeadlineMaxSize = 56;

const persistPreviewSelection = (
	model: PreviewEditorModel,
	selection: FontPreviewSelection,
) => {
	const saved = saveFontPreviewSelection(model.metadata.id, selection);
	if (model.state$.handoffUnavailable.peek() !== !saved) {
		model.state$.handoffUnavailable.set(!saved);
	}
};

const usePreviewEditor = () => {
	const model = useContext(PreviewEditorContext);
	if (!model) throw new Error('Preview editor context is unavailable');
	return model;
};

const PreviewRuntimeEffects = observer(() => {
	const model = usePreviewEditor();
	const activeSource = useValue(() => getActiveSource(model));
	const capabilitiesBySource = useValue(model.state$.capabilitiesBySource);
	const adjustableAxes = useValue(() => getAdjustableAxes(model));
	const activeAxes = useValue(() => getActiveAxes(model));
	const verifiedLanguages = useValue(() => getActiveLanguages(model));
	const featureTags = useValue(() => getActiveFeatureTags(model));
	const mode = useValue(model.state$.mode);
	const weight = useValue(model.state$.typographyByMode[mode].weight);
	const italic = useValue(model.state$.typographyByMode[mode].italic);
	const selectedLanguageId = useValue(model.state$.selectedLanguageId);
	const axisValues = useValue(model.state$.axisValues);
	const selection = useMemo<FontPreviewSelection>(
		() => ({
			format:
				model.variable && model.versions.latestVariable ? 'variable' : 'static',
			subset: model.previewSubset,
			style: italic ? 'italic' : 'normal',
			weight,
			axes: axisValues,
		}),
		[axisValues, italic, model, weight],
	);
	const pendingSelection = useRef(selection);
	const hasCachedCapabilities = activeSource
		? Object.hasOwn(capabilitiesBySource, activeSource.sha256)
		: false;

	useIsomorphicEffect(() => {
		if (
			model.familyKind === 'symbols' ||
			!window.matchMedia(compactPreviewQuery).matches
		) {
			return;
		}

		const initialHeadline = model.initialTypography.headline;
		const previousSize = initialHeadline.size;
		const compactSize = Math.min(previousSize, compactHeadlineMaxSize);
		if (compactSize === previousSize) return;

		initialHeadline.size = compactSize;
		if (model.state$.typographyByMode.headline.size.peek() === previousSize) {
			model.state$.typographyByMode.headline.size.set(compactSize);
		}
	}, [model]);

	useEffect(() => {
		if (!activeSource || hasCachedCapabilities) return;
		const controller = new AbortController();
		let current = true;
		let capabilitiesUrl: URL;

		try {
			capabilitiesUrl = new URL(
				activeSource.capabilitiesUrl,
				'https://api.fontsource.org',
			);
		} catch {
			model.state$.capabilitiesBySource.set({
				...model.state$.capabilitiesBySource.peek(),
				[activeSource.sha256]: null,
			});
			return;
		}
		const timeoutId = window.setTimeout(
			() => controller.abort(),
			capabilitiesTimeoutMs,
		);

		fetch(capabilitiesUrl, { signal: controller.signal })
			.then((response) => {
				if (!response.ok) throw new Error('Capabilities unavailable');
				return response.json() as Promise<GetRegistrySourceCapabilitiesResponse>;
			})
			.then((sourceCapabilities) => {
				if (!current) return;
				batch(() => {
					model.state$.capabilitiesBySource.set({
						...model.state$.capabilitiesBySource.peek(),
						[activeSource.sha256]: sourceCapabilities,
					});
					model.state$.verifiedLanguagesBySource.set({
						...model.state$.verifiedLanguagesBySource.peek(),
						[activeSource.sha256]: getVerifiedLanguages(
							model.languages,
							sourceCapabilities,
						),
					});
				});
			})
			.catch(() => {
				if (!current) return;
				model.state$.capabilitiesBySource.set({
					...model.state$.capabilitiesBySource.peek(),
					[activeSource.sha256]: null,
				});
			})
			.finally(() => window.clearTimeout(timeoutId));

		return () => {
			current = false;
			window.clearTimeout(timeoutId);
			controller.abort();
		};
	}, [activeSource, hasCachedCapabilities, model]);

	useEffect(() => {
		const current = model.state$.axisValues.peek();
		const next = Object.fromEntries(
			adjustableAxes.map((axis) => [
				axis.tag,
				clamp(current[axis.tag] ?? axis.default, axis.min, axis.max),
			]),
		);
		const unchanged =
			Object.keys(current).length === Object.keys(next).length &&
			Object.entries(next).every(([tag, value]) => current[tag] === value);
		if (!unchanged) model.state$.axisValues.set(next);
	}, [adjustableAxes, model]);

	useEffect(() => {
		const weightAxis = activeAxes.find((axis) => axis.tag === 'wght');
		const availableWeights = getAvailableWeights(model.metadata.weights);
		const min = weightAxis?.min ?? Math.min(...availableWeights);
		const max = weightAxis?.max ?? Math.max(...availableWeights);
		const nextWeight = clamp(weight, min, max);
		if (nextWeight !== weight) {
			model.state$.typographyByMode[mode].weight.set(nextWeight);
		}
	}, [activeAxes, mode, model, weight]);

	useEffect(() => {
		if (
			activeSource &&
			(!hasCachedCapabilities ||
				capabilitiesBySource[activeSource.sha256] === null)
		) {
			return;
		}
		if (
			verifiedLanguages.some((language) => language.id === selectedLanguageId)
		) {
			return;
		}
		const fallbackLanguage = getPreferredLanguage(
			verifiedLanguages,
			model.registry?.primaryLanguage,
		);
		if (!fallbackLanguage) {
			model.state$.selectedLanguageId.set('');
			return;
		}

		const currentTexts = model.state$.texts.peek();
		const currentSamples = model.state$.sampleTexts.peek();
		const nextSamples = createLanguageModeTexts(fallbackLanguage);
		const nextTexts = Object.fromEntries(
			modeLabels.map(({ value }) => [
				value,
				currentTexts[value] === currentSamples[value]
					? nextSamples[value]
					: currentTexts[value],
			]),
		) as typeof currentTexts;

		batch(() => {
			model.state$.selectedLanguageId.set(fallbackLanguage.id);
			model.state$.texts.set(nextTexts);
			model.state$.sampleTexts.set(nextSamples);
		});
	}, [
		activeSource,
		capabilitiesBySource,
		hasCachedCapabilities,
		model,
		selectedLanguageId,
		verifiedLanguages,
	]);

	useEffect(() => {
		const values = model.state$.featureValues.peek();
		const missing = featureTags.filter((tag) => values[tag] === undefined);
		if (!missing.length) return;
		model.state$.featureValues.set({
			...values,
			...Object.fromEntries(
				missing.map((tag) => [tag, enabledByDefaultFeatureTags.has(tag)]),
			),
		});
	}, [featureTags, model]);

	useEffect(() => {
		pendingSelection.current = selection;
		const timeoutId = window.setTimeout(
			() => persistPreviewSelection(model, selection),
			previewSelectionSaveDelayMs,
		);
		return () => window.clearTimeout(timeoutId);
	}, [model, selection]);

	useEffect(
		() => () => persistPreviewSelection(model, pendingSelection.current),
		[model],
	);

	return null;
});

const PreviewProvider = ({
	children,
	metadata,
	staticCSS,
	variable,
	variableCSS,
	versions,
	registry,
	languages,
	axisRegistry,
	capabilities,
	capabilitySource,
	symbols,
}: PropsWithChildren<PreviewEditorProps>) => {
	const setup = useMemo(
		() =>
			createPreviewEditorSetup({
				metadata,
				variable,
				registry,
				languages,
				axisRegistry,
				capabilities,
				capabilitySource,
			}),
		[
			axisRegistry,
			capabilities,
			capabilitySource,
			languages,
			metadata,
			registry,
			variable,
		],
	);
	const state$ = useObservable(setup.editorValue);
	const model = useMemo<PreviewEditorModel>(
		() => ({
			state$,
			metadata,
			staticCSS,
			variable,
			variableCSS,
			versions,
			registry,
			languages,
			axisRegistry,
			capabilities,
			symbols,
			previewSubset: setup.previewSubset,
			familyKind: setup.familyKind,
			initialTypography: setup.initialTypography,
		}),
		[
			axisRegistry,
			capabilities,
			languages,
			metadata,
			registry,
			symbols,
			staticCSS,
			variable,
			variableCSS,
			versions,
			setup,
			state$,
		],
	);

	return (
		<PreviewEditorContext.Provider value={model}>
			<PreviewRuntimeEffects />
			{children}
		</PreviewEditorContext.Provider>
	);
};

const PreviewFontStyle = observer(() => {
	const model = usePreviewEditor();
	const activeSource = useValue(() => getActiveSource(model));
	const packagePreviewFamily = getFontPreviewFamily(
		model.metadata,
		Boolean(model.variable),
	);
	const activePreviewFamily = activeSource
		? `${registrySourcePreviewFamily} ${activeSource.sha256.slice(0, 12)}`
		: packagePreviewFamily;

	return (
		<style
			// biome-ignore lint/security/noDangerouslySetInnerHtml: Generated from owned font metadata.
			dangerouslySetInnerHTML={{
				__html: [
					model.variableCSS ?? model.staticCSS,
					activeSource
						? getRegistrySourcePreviewCSS(activeSource, activePreviewFamily)
						: '',
				]
					.filter(Boolean)
					.join('\n'),
			}}
		/>
	);
});

const PreviewHandoffNotice = observer(() => {
	const model = usePreviewEditor();
	const unavailable = useValue(model.state$.handoffUnavailable);
	if (!unavailable) return null;
	return (
		<p className={classes.handoffNotice} role="status">
			This browser can’t save your preview settings. The Get font tab will use
			this family’s defaults.
		</p>
	);
});

export {
	PreviewFontStyle,
	PreviewHandoffNotice,
	PreviewProvider,
	usePreviewEditor,
};
