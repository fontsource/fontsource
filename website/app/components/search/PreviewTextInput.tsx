import { observer } from '@legendapp/state/react';
import type { DividerProps } from '@mantine/core';
import {
	Button,
	Group,
	Divider as MantineDivider,
	Menu,
	TextInput,
	useMantineColorScheme,
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
const ItemButton = observer(({ label, value, state$ }: ItemButtonProps) => {
	return (
		<Menu.Item
			component="button"
			onClick={() => {
				state$.preview.label.set(label);
				state$.preview.value.set(value);
				state$.preview.inputView.set('');
			}}
		>
			{value}
		</Menu.Item>
	);
});

const PreviewSelector = observer(({ state$ }: PreviewProps) => {
	const { colorScheme } = useMantineColorScheme();
	const label = state$.preview.label.get();

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
				value={state$.preview.inputView.get()}
				onChange={(e) => {
					state$.preview.inputView.set(e.currentTarget.value);
				}}
				placeholder="Type something"
				variant="unstyled"
				styles={(theme) => ({
					root: {
						width: '60%',
					},
					input: {
						backgroundColor:
							colorScheme === 'dark'
								? theme.colors.background[4]
								: theme.colors.background[0],
					},
				})}
			/>
		</Group>
	);
});

export { PreviewSelector };
