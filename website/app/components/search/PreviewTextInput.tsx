import { observer, useValue } from '@legendapp/state/react';
import type { DividerProps } from '@mantine/core';
import {
	Button,
	Group,
	Divider as MantineDivider,
	Menu,
	TextInput,
} from '@mantine/core';
import { Fragment } from 'react';

import { IconCaret } from '@/components/icons';
import { previewText } from '@/utils/preview-text';

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
						aria-label={`Preview text: ${label}`}
						className={classes.button}
						rightSection={<IconCaret aria-hidden="true" />}
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
					{previewText.search.groups.map((group) => (
						<Fragment key={group.label}>
							<PreviewMenuDivider label={group.label} />
							{group.options.map((option) => (
								<ItemButton key={option.value} {...option} state$={state$} />
							))}
						</Fragment>
					))}
				</Menu.Dropdown>
			</Menu>
			<TextInput
				aria-label="Custom preview text"
				value={customValue}
				onChange={(e) => {
					state$.preview.customValue.set(e.currentTarget.value);
				}}
				placeholder="Enter preview text"
				variant="unstyled"
				classNames={{ root: classes.inputRoot, input: classes.input }}
			/>
		</Group>
	);
});

export { PreviewSelector };
