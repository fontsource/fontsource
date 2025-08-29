import { Checkbox, Group, Stack, Title } from '@mantine/core';

interface Formats {
	ttf: boolean;
	woff: boolean;
	woff2: boolean;
}

interface FormatSelectorProps {
	formats: Formats;
	onFormatChange: (format: keyof Formats, checked: boolean) => void;
}

const formatOptions = [
	{ key: 'ttf', label: 'TTF' },
	{ key: 'woff', label: 'WOFF' },
	{ key: 'woff2', label: 'WOFF2' },
] as const;

export const FormatSelector = ({
	formats,
	onFormatChange,
}: FormatSelectorProps) => {
	return (
		<Stack>
			<Title order={3}>Output Formats</Title>
			<Group>
				{formatOptions.map(({ key, label }) => (
					<Checkbox
						key={key}
						label={label}
						checked={formats[key]}
						onChange={(event) =>
							onFormatChange(key, event.currentTarget.checked)
						}
					/>
				))}
			</Group>
		</Stack>
	);
};
