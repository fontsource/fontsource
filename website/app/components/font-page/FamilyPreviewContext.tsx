import { batch } from '@legendapp/state';
import {
	observer,
	useMount,
	useObservable,
	useValue,
} from '@legendapp/state/react';
import { useIsomorphicEffect } from '@mantine/hooks';
import {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useMemo,
} from 'react';
import { useLocation } from 'react-router';
import type { GetRegistrySourceCapabilitiesResponse } from '@/generated/api';
import {
	getFontPreviewFamily,
	getRegistrySourcePreviewCSS,
	registrySourcePreviewFamily,
} from '@/utils/font-preview';
import { getRecommendedPreviewText } from '@/utils/language/language';
import {
	clamp,
	createPreviewEditorSetup,
	enabledByDefaultFeatureTags,
	getActiveAxes,
	getActiveFeatureTags,
	getActiveSource,
	getAdjustableAxes,
	getAvailableWeights,
	getVerifiedLanguages,
	type PreviewEditorModel,
	type PreviewEditorProps,
} from './FamilyPreviewState';

const PreviewEditorContext = createContext<PreviewEditorModel | null>(null);
const capabilitiesTimeoutMs = 12_000;
const compactPreviewQuery = '(max-width: 48em)';
const compactHeadlineMaxSize = 56;

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
	const featureTags = useValue(() => getActiveFeatureTags(model));
	const mode = useValue(model.state$.mode);
	const weight = useValue(model.state$.typographyByMode[mode].weight);
	const hasCachedCapabilities = activeSource
		? capabilitiesBySource[activeSource.sha256] !== undefined
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

	return null;
});

const PreviewProvider = ({
	children,
	metadata,
	previewCSS,
	variable,
	registry,
	languages,
	axisRegistry,
	capabilities,
	capabilitySource,
	symbolNames,
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
	const location = useLocation();
	const state$ = useObservable(setup.editorValue);
	// History state survives reloads but is unavailable to the server.
	useMount(() => {
		if (!location.state) return;

		const previewText = location.state?.previewText;
		const language = languages.find(
			(item) => item.id === location.state?.previewLanguageId,
		);
		const recommendedText = getRecommendedPreviewText(
			{
				...metadata,
				...registry,
				sampleText: language?.sampleText ?? registry.sampleText,
			},
			'short',
			languages,
		);
		state$.assign({
			selectedLanguageId: language?.id ?? '',
			customText:
				typeof previewText === 'string' && previewText !== recommendedText
					? previewText
					: null,
		});
	});
	const model = useMemo<PreviewEditorModel>(
		() => ({
			state$,
			metadata,
			previewCSS,
			variable,
			registry,
			languages,
			axisRegistry,
			capabilities,
			symbolNames,
			familyKind: setup.familyKind,
			initialTypography: setup.initialTypography,
		}),
		[
			axisRegistry,
			capabilities,
			languages,
			metadata,
			registry,
			symbolNames,
			previewCSS,
			variable,
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
					model.previewCSS,
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

export { PreviewFontStyle, PreviewProvider, usePreviewEditor };
