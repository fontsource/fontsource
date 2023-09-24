import { useObserve, useSelector } from '@legendapp/state/react';
import type { DividerProps } from '@mantine/core';
import {
	Button,
	Divider as MantineDivider,
	Menu,
	TextInput,
	useMantineColorScheme,
} from '@mantine/core';

import { IconCaret } from '@/components';

import { previewInputView, previewLabel, previewValue } from './observables';
import classes from './PreviewTextInput.module.css';

const Divider = ({ label, ...others }: DividerProps) => {
	return (
		<Menu.Item disabled>
			<div className={classes.separator}>
				{/* @ts-expect-error - Mantine v7 prop typing error */}
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
	setLabel: (label: React.SetStateAction<string>) => void;
	value: string;
	setValue: (value: React.SetStateAction<string>) => void;
}
const ItemButton = ({ label, setLabel, value, setValue }: ItemButtonProps) => {
	return (
		<Menu.Item
			component="button"
			onClick={() => {
				setLabel(label);
				setValue(value);
			}}
		>
			{value}
		</Menu.Item>
	);
};

const PreviewSelector = () => {
	const labelSelect = useSelector(previewLabel);
	const inputViewSelect = useSelector(previewInputView);
	const { colorScheme } = useMantineColorScheme();

	useObserve(() => {
		if (previewLabel.get() !== 'Custom') {
			previewInputView.set('');
		}
	});

	return (
		<div className={classes.wrapper}>
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
						{labelSelect}
					</Button>
				</Menu.Target>
				<Menu.Dropdown>
					<Divider label="Sentences" />
					<ItemButton
						label="Sentence"
						value="The quick brown fox jumps over the lazy dog."
						setLabel={previewLabel.set}
						setValue={previewValue.set}
					/>
					<ItemButton
						label="Sentence"
						value="Sphinx of black quartz, judge my vow."
						setLabel={previewLabel.set}
						setValue={previewValue.set}
					/>
					<Divider label="Alphabets" />
					<ItemButton
						label="Alphabet"
						value="ABCDEFGHIJKLMNOPQRSTUVWXYZ"
						setLabel={previewLabel.set}
						setValue={previewValue.set}
					/>
					<ItemButton
						label="Alphabet"
						value="abcdefghijklmnopqrstuvwxyz"
						setLabel={previewLabel.set}
						setValue={previewValue.set}
					/>
					<Divider label="Numbers" />
					<ItemButton
						label="Number"
						value="0123456789"
						setLabel={previewLabel.set}
						setValue={previewValue.set}
					/>
					<Divider label="Symbols" />
					<ItemButton
						label="Symbol"
						value="!@#$%^&*()_+-=[]{}|;':,./<>?"
						setLabel={previewLabel.set}
						setValue={previewValue.set}
					/>
				</Menu.Dropdown>
			</Menu>
			<TextInput
				value={inputViewSelect}
				onChange={(e) => {
					previewInputView.set(e.currentTarget.value);
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
		</div>
	);
};

export { PreviewSelector };
