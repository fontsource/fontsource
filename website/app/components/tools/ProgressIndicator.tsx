import { Progress } from '@mantine/core';

interface ProgressData {
	value: number;
	text: string;
}

interface ProgressIndicatorProps {
	progress: ProgressData;
	isVisible: boolean;
}

export const ProgressIndicator = ({
	progress,
	isVisible,
}: ProgressIndicatorProps) => {
	if (!isVisible) {
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
