import { Checkbox, Group, Text } from '@mantine/core';
import classes from './FontWorkbench.module.css';
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
	{
		key: 'woff2',
		label: 'WOFF2 (recommended)',
		description: 'For modern websites.',
	},
	{ key: 'woff', label: 'WOFF', description: 'For older browsers.' },
	{ key: 'ttf', label: 'TTF', description: 'For desktop apps.' },
] as const;

export const FormatSelector = ({
	formats,
	onChange,
	disabled = false,
}: FormatSelectorProps) => {
	const hasFormat = Object.values(formats).some(Boolean);

	return (
		<ToolOptions title="Output Formats">
			<Text size="sm" className={classes.supportingText}>
				Choose one or more formats. OTF is supported as an input format only.
			</Text>
			<Group mt="sm" gap="xl" align="flex-start">
				{formatOptions.map(({ key, label, description }) => (
					<Checkbox
						key={key}
						label={label}
						description={
							<span className={classes.supportingText}>{description}</span>
						}
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
