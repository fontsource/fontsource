import type { BoxProps } from '@mantine/core';
import { Badge, Group, Tabs, Title } from '@mantine/core';
import { useHover } from '@mantine/hooks';
import { Link } from 'react-router';

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
				<Group align="center" data-m:load={`view-tab=${tabsValue}`}>
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
					<Link to={`/fonts/${metadata.id}`} style={{ textDecoration: 'none' }}>
						<Tabs.Tab value="preview">Preview</Tabs.Tab>
					</Link>
					<Link
						to={`/fonts/${metadata.id}/install`}
						style={{ textDecoration: 'none' }}
					>
						<Tabs.Tab value="install">Install</Tabs.Tab>
					</Link>
					<a
						href={`https://api.fontsource.org/v1/download/${metadata.id}`}
						className={classes['download-button']}
						ref={refDownload}
						data-m:click={`download=${metadata.id}`}
					>
						<Group gap="xs">
							<IconDownload height={19} data-active={hoveredDownload} />
							Download
						</Group>
					</a>
					<Link
						to={`/fonts/${metadata.id}/cdn`}
						style={{ textDecoration: 'none' }}
					>
						<Tabs.Tab
							value="cdn"
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
					</Link>
				</Tabs.List>
			</ContentHeader>
			{children}
		</Tabs>
	);
};
