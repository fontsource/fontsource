import type { FontInspection } from '@fontsource-utils/core';
import {
	createContext,
	type Dispatch,
	type MutableRefObject,
	type ReactNode,
	type SetStateAction,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import invariant from 'tiny-invariant';

export type FontToolPreset = 'converter' | 'optimizer';

export interface FontSourceEntry {
	id: number;
	file: File;
	inspection: FontInspection | null;
	error?: string;
}

export interface FontOutputSettings {
	formats: { woff2: boolean; woff: boolean; ttf: boolean };
	includeCss: boolean;
	display: string;
	path: string;
}

interface FontToolsSession {
	nextSourceId: MutableRefObject<number>;
	stopRequested: MutableRefObject<boolean>;
	sources: FontSourceEntry[];
	setSources: Dispatch<SetStateAction<FontSourceEntry[]>>;
	outputs: Record<FontToolPreset, FontOutputSettings>;
	setOutputs: Dispatch<
		SetStateAction<Record<FontToolPreset, FontOutputSettings>>
	>;
	activePreset: FontToolPreset | undefined;
	setActivePreset: Dispatch<SetStateAction<FontToolPreset | undefined>>;
}

const defaultOutput = (preset: FontToolPreset): FontOutputSettings => ({
	formats: { woff2: true, woff: false, ttf: false },
	includeCss: preset === 'optimizer',
	display: 'swap',
	path: './files',
});

const FontToolsContext = createContext<FontToolsSession | undefined>(undefined);

export const FontToolsProvider = ({ children }: { children: ReactNode }) => {
	const nextSourceId = useRef(0);
	const stopRequested = useRef(false);
	const [sources, setSources] = useState<FontSourceEntry[]>([]);
	const [outputs, setOutputs] = useState(() => ({
		converter: defaultOutput('converter'),
		optimizer: defaultOutput('optimizer'),
	}));
	const [activePreset, setActivePreset] = useState<FontToolPreset>();

	useEffect(
		() => () => {
			stopRequested.current = true;
		},
		[],
	);

	const session = useMemo(
		() => ({
			nextSourceId,
			stopRequested,
			sources,
			setSources,
			outputs,
			setOutputs,
			activePreset,
			setActivePreset,
		}),
		[sources, outputs, activePreset],
	);

	return (
		<FontToolsContext.Provider value={session}>
			{children}
		</FontToolsContext.Provider>
	);
};

export const useFontToolsSession = () => {
	const session = useContext(FontToolsContext);
	invariant(session, 'useFontWorkbench must be used within FontToolsProvider.');
	return session;
};
