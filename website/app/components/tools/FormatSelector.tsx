import { Checkbox, Group, Text } from '@mantine/core';
import classes from './FontWorkbench.module.css';

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
		<fieldset className={classes.fieldset}>
			<legend className={classes.legend}>Output formats</legend>
			<Text size="sm" className={classes.supportingText}>
				Select one or more formats for the converted files.
			</Text>
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
		</fieldset>
	);
};
