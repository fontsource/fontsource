import { Checkbox, Group, Text } from '@mantine/core';
import { ToolOptions } from './ToolOptions';

interface Formats {
	ttf: boolean;
	woff: boolean;
	woff2: boolean;
}

interface FormatSelectorProps {
	formats: Formats;
	onChange: (format: keyof Formats, checked: boolean) => void;
	disabled?: boolean;
}

const formatOptions = [
	{ key: 'woff2', label: 'WOFF2 (recommended)' },
	{ key: 'woff', label: 'WOFF' },
	{ key: 'ttf', label: 'TTF' },
] as const;

export const FormatSelector = ({
	formats,
	onChange,
	disabled = false,
}: FormatSelectorProps) => {
	const hasFormat = Object.values(formats).some(Boolean);

	return (
		<ToolOptions title="Output Formats">
			<Group mt="sm">
				{formatOptions.map(({ key, label }) => (
					<Checkbox
						key={key}
						label={label}
						checked={formats[key]}
						disabled={disabled}
						onChange={({ currentTarget: { checked } }) =>
							onChange(key, checked)
						}
					/>
				))}
			</Group>
			{!hasFormat && (
				<Text size="xs" c="red" mt="xs" role="alert">
					Select at least one output format.
				</Text>
			)}
		</ToolOptions>
	);
};
