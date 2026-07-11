import { observer, useValue } from '@legendapp/state/react';
import type { DividerProps } from '@mantine/core';
import {
	Button,
	Group,
	Divider as MantineDivider,
	Menu,
	TextInput,
} from '@mantine/core';

import { IconCaret } from '@/components/icons';

import type { SearchState } from './observables';
import classes from './PreviewTextInput.module.css';

interface PreviewProps {
	state$: SearchState;
}

export const PreviewMenuDivider = ({ label, ...others }: DividerProps) => {
	return (
		<Menu.Item disabled>
			<div className={classes.separator}>
				<MantineDivider
					classNames={{ label: classes['separator-label'] }}
					label={label}
					{...others}
				/>
			</div>
		</Menu.Item>
	);
};

interface ItemButtonProps {
	label: string;
	value: string;
	state$: SearchState;
}
const ItemButton = ({ label, value, state$ }: ItemButtonProps) => {
	return (
		<Menu.Item
			component="button"
			onClick={() => {
				state$.preview.assign({
					presetLabel: label,
					presetValue: value,
					customValue: '',
				});
			}}
		>
			{value}
		</Menu.Item>
	);
};

const PreviewSelector = observer(({ state$ }: PreviewProps) => {
	const presetLabel = useValue(state$.preview.presetLabel);
	const customValue = useValue(state$.preview.customValue);
	const label = customValue === '' ? presetLabel : 'Custom';

	return (
		<Group
			className={classes.wrapper}
			gap={0}
			justify="space-between"
			visibleFrom="sm"
			wrap="nowrap"
		>
			<Menu shadow="md">
				<Menu.Target>
					<Button
						className={classes.button}
						rightSection={<IconCaret />}
						styles={{
							inner: {
								justifyContent: 'space-between',
							},
						}}
					>
						{label}
					</Button>
				</Menu.Target>
				<Menu.Dropdown>
					<PreviewMenuDivider label="Sentences" />
					<ItemButton
						label="Sentence"
						value="The quick brown fox jumps over the lazy dog."
						state$={state$}
					/>
					<ItemButton
						label="Sentence"
						value="Sphinx of black quartz, judge my vow."
						state$={state$}
					/>
					<PreviewMenuDivider label="Alphabets" />
					<ItemButton
						label="Alphabet"
						value="ABCDEFGHIJKLMNOPQRSTUVWXYZ"
						state$={state$}
					/>
					<ItemButton
						label="Alphabet"
						value="abcdefghijklmnopqrstuvwxyz"
						state$={state$}
					/>
					<PreviewMenuDivider label="Numbers" />
					<ItemButton label="Number" value="0123456789" state$={state$} />
					<PreviewMenuDivider label="Symbols" />
					<ItemButton
						label="Symbol"
						value="!@#$%^&*()_+-=[]{}|;':,./<>?"
						state$={state$}
					/>
				</Menu.Dropdown>
			</Menu>
			<TextInput
				value={customValue}
				onChange={(e) => {
					state$.preview.customValue.set(e.currentTarget.value);
				}}
				placeholder="Type something"
				variant="unstyled"
				classNames={{ root: classes.inputRoot, input: classes.input }}
			/>
		</Group>
	);
});

export { PreviewSelector };
