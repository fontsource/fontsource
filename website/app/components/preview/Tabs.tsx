import type { BoxProps } from '@mantine/core';
import { Badge, Group, Tabs, Title, VisuallyHidden } from '@mantine/core';
import { useHover } from '@mantine/hooks';
import { Link } from 'react-router';

import { IconDownload, IconGlobe } from '@/components/icons';
import { ContentHeader } from '@/components/layout/ContentHeader';
import type { GetFontResponse } from '@/generated/api';

import classes from './Tabs.module.css';

interface TabWrapperProps extends BoxProps {
	metadata: GetFontResponse;
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
				<Group
					align="center"
					gap="sm"
					className={classes.heading}
					data-m:load={`view-tab=${tabsValue}`}
				>
					<Title order={1} c="purple.0" className={classes.title}>
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
					<Link
						to={`/fonts/${metadata.id}`}
						className={classes.link}
						prefetch="intent"
					>
						<Tabs.Tab value="preview">Preview</Tabs.Tab>
					</Link>
					<Link
						to={`/fonts/${metadata.id}/install`}
						className={classes.link}
						prefetch="intent"
					>
						<Tabs.Tab value="install">Install</Tabs.Tab>
					</Link>
					<a
						href={`/fonts/${metadata.id}/download`}
						className={classes['download-button']}
						ref={refDownload}
						data-m:click={`download=${metadata.id}`}
						target="_blank"
						rel="noopener noreferrer nofollow"
					>
						<Group gap="xs">
							<IconDownload
								aria-hidden
								height={19}
								data-active={hoveredDownload}
							/>
							Download
							<VisuallyHidden> (opens in a new tab)</VisuallyHidden>
						</Group>
					</a>
					<Link
						to={`/fonts/${metadata.id}/cdn`}
						className={classes.link}
						prefetch="intent"
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
