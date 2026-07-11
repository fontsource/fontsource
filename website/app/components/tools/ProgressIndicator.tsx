import type { ObservableObject } from '@legendapp/state';
import { useValue } from '@legendapp/state/react';
import { Progress } from '@mantine/core';

import type { ConverterState } from '@/hooks/useFontConverter';

interface ProgressIndicatorProps {
	state$: ObservableObject<ConverterState>;
}

export const ProgressIndicator = ({ state$ }: ProgressIndicatorProps) => {
	const progress = useValue(() =>
		state$.isConverting.get() || state$.isCreatingZip.get()
			? state$.progress.get()
			: undefined,
	);

	if (!progress) {
		return null;
	}

	return (
		<Progress.Root size="lg">
			<Progress.Section value={progress.value}>
				<Progress.Label>{progress.text}</Progress.Label>
			</Progress.Section>
		</Progress.Root>
	);
};
