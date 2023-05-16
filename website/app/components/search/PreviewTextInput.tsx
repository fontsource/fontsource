import { useObserve, useSelector } from '@legendapp/state/react';
import type { DividerProps } from '@mantine/core';
import {
	Button,
	createStyles,
	Divider as MantineDivider,
	Menu,
	rem,
	TextInput,
} from '@mantine/core';

import { IconCaret } from '@/components';

import { previewInputView, previewLabel, previewValue } from './observables';

const useStyles = createStyles((theme) => ({
	wrapper: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: `0 ${rem(24)}`,
		backgroundColor:
			theme.colorScheme === 'dark'
				? theme.colors.background[4]
				: theme.colors.background[0],
		borderBottom: `${rem(1)} solid ${
			theme.colorScheme === 'dark' ? '#2C3651' : '#E1E3EC'
		}`,
		borderLeft: `${rem(1)} solid ${
			theme.colorScheme === 'dark' ? '#2C3651' : '#E1E3EC'
		}`,
		borderRight: `${rem(1)} solid ${
			theme.colorScheme === 'dark' ? '#2C3651' : '#E1E3EC'
		}`,

		'&:focus-within': {
			borderBottomColor: theme.colors.purple[0],
		},

		[`@media (max-width: ${theme.breakpoints.md})`]: {
			borderRight: 'none',
		},

		[`@media (max-width: ${theme.breakpoints.sm})`]: {
			display: 'none',
		},
	},

	button: {
		padding: `${rem(2)} ${rem(16)}`,
		height: rem(40),

		backgroundColor:
			theme.colorScheme === 'dark'
				? theme.colors.background[4]
				: theme.colors.background[0],

		color:
			theme.colorScheme === 'dark'
				? theme.colors.text[0]
				: theme.colors.text[1],

		fontWeight: 400,

		'&:hover': {
			backgroundColor: theme.colors.purpleHover[0],
		},
	},

	separator: {
		boxSizing: 'border-box',
		textAlign: 'left',
		width: '100%',
		padding: `0 ${rem(2)}`,
	},

	separatorLabel: {
		color:
			theme.colorScheme === 'dark'
				? theme.colors.dark[3]
				: theme.colors.gray[5],
	},
}));

const Divider = ({ label, ...others }: DividerProps) => {
	const { classes } = useStyles();
	return (
		<Menu.Item disabled>
			<div className={classes.separator}>
				<MantineDivider
					classNames={{ label: classes.separatorLabel }}
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
	const { classes } = useStyles();
	const labelSelect = useSelector(previewLabel);
	const inputViewSelect = useSelector(previewInputView);

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
						rightIcon={<IconCaret />}
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
							theme.colorScheme === 'dark'
								? theme.colors.background[4]
								: theme.colors.background[0],
					},
				})}
			/>
		</div>
	);
};

export { PreviewSelector };
