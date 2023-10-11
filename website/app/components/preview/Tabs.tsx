import type { BoxProps } from '@mantine/core';
import { Badge, Group, Tabs, Title } from '@mantine/core';
import { useHover } from '@mantine/hooks';
import { useNavigate } from '@remix-run/react';

import { IconDownload, IconGlobe } from '@/components/icons';
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
	const { hovered: hoveredDownload, ref: refDownload } =
		useHover<HTMLAnchorElement>();
	const { hovered: hoveredGlobe, ref: refGlobe } =
		useHover<HTMLButtonElement>();

	return (
		<Tabs
			value={tabsValue}
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
						ref={refDownload}
					>
						<Group gap="xs">
							<IconDownload height={19} data-active={hoveredDownload} />
							Download
						</Group>
					</a>
					<Tabs.Tab
						value="cdn"
						onClick={() => {
							navigate(`/fonts/${metadata.id}/cdn`);
						}}
						ref={refGlobe}
						className={classes['hide-tab']}
					>
						<Group gap="xs">
							<IconGlobe
								height={19}
								data-active={tabsValue === 'cdn' || hoveredGlobe}
							/>
							CDN
						</Group>
					</Tabs.Tab>
				</Tabs.List>
			</ContentHeader>
			{children}
		</Tabs>
	);
};
