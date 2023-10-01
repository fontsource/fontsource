import type { BoxProps } from '@mantine/core';
import {
	Badge,
	Group,
	Tabs,
	Title,
	useComputedColorScheme,
	useMantineTheme,
} from '@mantine/core';
import { useHover } from '@mantine/hooks';
import { useNavigate } from '@remix-run/react';

import { IconDownload } from '@/components/icons';
import { ContentHeader } from '@/components/layout/ContentHeader';
import type { Metadata } from '@/utils/types';

import classes from './Tabs.module.css';

interface TabWrapperProps extends BoxProps {
	metadata: Metadata;
	tabsValue: string;
	children: React.ReactNode;
}

export const TabsWrapper = ({
	metadata,
	tabsValue,
	children,
}: TabWrapperProps) => {
	const navigate = useNavigate();
	const theme = useMantineTheme();
	const { hovered, ref } = useHover<HTMLAnchorElement>();
	const colorScheme = useComputedColorScheme('light');

	return (
		<Tabs
			value={tabsValue}
			onChange={(value) => {
				if (value === 'preview') navigate(`/fonts/${metadata.id}`);
				navigate(`/fonts/${metadata.id}/${String(value)}`);
			}}
			unstyled
			classNames={{
				tab: classes.tab,
				list: classes.list,
			}}
		>
			<ContentHeader>
				<Group align="center">
					<Title order={1} c="purple.0" pr="lg">
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
						onClick={() => {
							navigate(`/fonts/${metadata.id}`);
						}}
					>
						Preview
					</Tabs.Tab>
					<Tabs.Tab
						value="install"
						onClick={() => {
							navigate(`/fonts/${metadata.id}/install`);
						}}
					>
						Install
					</Tabs.Tab>
					<a
						href={`https://api.fontsource.org/v1/download/${metadata.id}`}
						className={classes['download-button']}
						ref={ref}
					>
						<IconDownload
							height={19}
							stroke={
								hovered
									? theme.colors.purple[0]
									: colorScheme === 'dark'
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
