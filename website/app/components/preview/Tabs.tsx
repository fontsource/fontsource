import type { BoxProps } from '@mantine/core';
import { Badge, createStyles, useMantineTheme } from '@mantine/core';
import { Group, rem, Tabs, Title } from '@mantine/core';
import { useHover } from '@mantine/hooks';
import { useNavigate } from '@remix-run/react';

import { ContentHeader, IconDownload } from '@/components';
import type { Metadata } from '@/utils/types';

interface TabWrapperProps extends BoxProps {
	metadata: Metadata;
	tabsValue: string;
}

const useStyles = createStyles((theme) => ({
	badge: {
		padding: `${rem(4)} ${rem(8)}`,
		gap: rem(10),
		color:
			theme.colorScheme === 'dark'
				? theme.colors.text[0]
				: theme.colors.text[1],
		backgroundColor:
			theme.colorScheme === 'dark'
				? theme.colors.background[3]
				: theme.colors.background[2],
		borderRadius: rem(4),
		fontFamily: theme.fontFamilyMonospace,
		textTransform: 'lowercase',

		[theme.fn.smallerThan('md')]: {
			display: 'none',
		},
	},

	downloadButton: {
		display: 'flex',
		alignItems: 'center',
		gap: rem(10),
		backgroundColor: 'transparent',
		color:
			theme.colorScheme === 'dark'
				? theme.colors.text[0]
				: theme.colors.text[1],
		border: 'none',
		borderRadius: rem(4),
		padding: `${theme.spacing.xs} ${theme.spacing.md}`,
		cursor: 'pointer',
		textDecoration: 'none',

		'&:hover': {
			backgroundColor: theme.fn.rgba(theme.colors.purple[0], 0.1),
			color: theme.colors.purple[0],
		},

		[theme.fn.smallerThan('sm')]: {
			display: 'none',
		},
	},
}));

export const TabsWrapper = ({
	metadata,
	tabsValue,
	children,
}: TabWrapperProps) => {
	const { classes } = useStyles();
	const navigate = useNavigate();
	const theme = useMantineTheme();
	const { hovered, ref } = useHover<HTMLAnchorElement>();

	return (
		<Tabs
			value={tabsValue}
			onTabChange={(value) => {
				if (value === 'preview') navigate(`/fonts/${metadata.id}`);
				navigate(`/fonts/${metadata.id}/${value}`);
			}}
			unstyled
			styles={(theme) => ({
				tab: {
					...theme.fn.focusStyles(),
					backgroundColor: 'transparent',
					color:
						theme.colorScheme === 'dark'
							? theme.colors.text[0]
							: theme.colors.text[1],
					border: 'none',
					borderRadius: rem(4),
					padding: `${theme.spacing.xs} ${theme.spacing.md}`,
					cursor: 'pointer',
					display: 'flex',
					alignItems: 'center',

					'&[data-active]': {
						backgroundColor: theme.fn.rgba(theme.colors.purple[0], 0.1),
						color: theme.colors.purple[0],
						fontWeight: 700,
					},

					'&:hover': {
						backgroundColor: theme.fn.rgba(theme.colors.purple[0], 0.1),
						color: theme.colors.purple[0],
					},
				},

				tabsList: {
					display: 'flex',
					alignItems: 'center',
					gap: rem(10),
				},
			})}
		>
			<ContentHeader>
				<Group align="center">
					<Title order={1} color="purple.0" pr="lg">
						{metadata.family}
					</Title>
					<Badge color="gray" variant="light" className={classes.badge}>
						{metadata.category}
					</Badge>
					<Badge color="gray" variant="light" className={classes.badge}>
						{metadata.type}
					</Badge>
				</Group>
				<Tabs.List>
					<Tabs.Tab
						value="preview"
						onClick={() => navigate(`/fonts/${metadata.id}`)}
					>
						Preview
					</Tabs.Tab>
					<Tabs.Tab
						value="install"
						onClick={() => navigate(`/fonts/${metadata.id}/install`)}
					>
						Install
					</Tabs.Tab>
					<a
						href={`https://api.fontsource.org/v1/download/${metadata.id}`}
						className={classes.downloadButton}
						ref={ref}
					>
						<IconDownload
							height={19}
							stroke={
								hovered
									? theme.colors.purple[0]
									: theme.colorScheme === 'dark'
									? theme.colors.text[0]
									: theme.colors.text[1]
							}
						/>
						Download
					</a>
				</Tabs.List>
			</ContentHeader>
			{children}
		</Tabs>
	);
};
