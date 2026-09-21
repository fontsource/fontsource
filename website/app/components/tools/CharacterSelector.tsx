import '@mantine/core/styles/Radio.css';
import '@mantine/core/styles/Pill.css';
import '@mantine/core/styles/PillsInput.css';
import { Group, MultiSelect, Radio, Textarea } from '@mantine/core';
import { useEffect, useRef } from 'react';
import { type CharacterSelection, characterSetOptions } from './characters';
import classes from './FontWorkbench.module.css';
import { ToolOptions } from './ToolOptions';

interface CharacterSelectorProps {
	value: CharacterSelection;
	onChange: (value: CharacterSelection) => void;
	disabled?: boolean;
	error?: string;
}

const CharacterSelector = ({
	value,
	onChange,
	disabled = false,
	error,
}: CharacterSelectorProps) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const textRef = useRef<HTMLTextAreaElement>(null);
	useEffect(() => {
		if (error) (textRef.current ?? inputRef.current)?.focus();
	}, [error]);
	return (
		<ToolOptions title="Characters to Keep">
			<Radio.Group
				aria-label="Characters to keep"
				value={value.mode}
				onChange={(mode) =>
					onChange({ ...value, mode: mode as CharacterSelection['mode'] })
				}
			>
				<Group mt="sm">
					<Radio value="all" label="All characters" disabled={disabled} />
					<Radio
						value="subsets"
						label="Choose character sets"
						disabled={disabled}
					/>
					<Radio value="text" label="Enter text" disabled={disabled} />
				</Group>
			</Radio.Group>

			{value.mode === 'subsets' && (
				<MultiSelect
					ref={inputRef}
					error={error}
					placeholder="Search character sets"
					mt="md"
					maw={700}
					label="Character sets"
					classNames={{ description: classes.supportingText }}
					description="Include Latin for basic letters, numbers, and punctuation."
					data={characterSetOptions}
					searchable
					clearable
					value={value.subsets}
					disabled={disabled}
					onChange={(subsets) => onChange({ ...value, subsets })}
				/>
			)}
			{value.mode === 'text' && (
				<Textarea
					ref={textRef}
					error={error}
					mt="md"
					maw={700}
					label="Text to keep"
					classNames={{ description: classes.supportingText }}
					description="Other characters will use a fallback font."
					minRows={3}
					autosize
					value={value.text}
					disabled={disabled}
					onChange={(event) =>
						onChange({ ...value, text: event.currentTarget.value })
					}
				/>
			)}
		</ToolOptions>
	);
};

export default CharacterSelector;
