import {
	Divider,
	Group,
	Popover,
	Stack,
	Text,
	UnstyledButton,
} from '@mantine/core';
import { millify } from 'millify';

import {
	IconCaret,
	IconDownload,
	IconEdit,
	IconGithub,
	IconNpm,
} from '@/components/icons';
import type { Metadata } from '@/utils/types';
import type { KeyboardEvent, ReactNode } from 'react';
import { useRef, useState } from 'react';

import classes from './Info.module.css';

interface InfoProps {
	metadata: Metadata;
	isCDN?: boolean;
	hits?: number;
}

interface DetailsPopoverLink {
	ariaLabel: string;
	href: string;
	label: string;
}

interface DetailsPopoverProps {
	ariaLabel: string;
	icon: ReactNode;
	links: DetailsPopoverLink[];
	label: string;
}

const handleMenuTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
	if (event.key === 'Enter' || event.key === ' ') {
		event.preventDefault();
		event.currentTarget.click();
	}
};

const DetailsPopover = ({
	ariaLabel,
	icon,
	links,
	label,
}: DetailsPopoverProps) => {
	const [opened, setOpened] = useState(false);
	const firstLinkRef = useRef<HTMLAnchorElement>(null);

	const handleOpenedChange = (nextOpened: boolean) => {
		setOpened(nextOpened);

		if (nextOpened) {
			setTimeout(() => firstLinkRef.current?.focus(), 0);
		}
	};

	return (
		<Popover
			shadow="none"
			width="target"
			position="bottom-start"
			offset={4}
			opened={opened}
			onChange={handleOpenedChange}
			trapFocus
			classNames={{
				dropdown: classes['link-popover'],
			}}
		>
			<Popover.Target>
				<UnstyledButton
					aria-label={ariaLabel}
					className={classes.button}
					onClick={() => handleOpenedChange(!opened)}
					onKeyDown={handleMenuTriggerKeyDown}
					type="button"
				>
					<Group className={classes['button-content']} gap="xs">
						{icon}
						{label}
						<IconCaret className={classes.caret} />
					</Group>
				</UnstyledButton>
			</Popover.Target>
			<Popover.Dropdown>
				<Stack gap={2}>
					{links.map((link, index) => (
						<UnstyledButton
							key={link.href}
							component="a"
							aria-label={link.ariaLabel}
							className={classes['popover-link']}
							href={link.href}
							ref={index === 0 ? firstLinkRef : undefined}
							target="_blank"
							rel="noreferrer"
						>
							{link.label}
						</UnstyledButton>
					))}
				</Stack>
			</Popover.Dropdown>
		</Popover>
	);
};

export const InfoWrapper = ({ metadata, isCDN, hits }: InfoProps) => {
	const staticSourcePath =
		metadata.category === 'icons' ? 'icons' : metadata.type;
	const staticSourceUrl = `https://github.com/fontsource/font-files/tree/main/fonts/${staticSourcePath}/${metadata.id}`;

	return (
		<div className={classes.wrapper}>
			<Text fw={700} fz={15}>
				Font Details
			</Text>
			<Divider my={12} />
			<Stack gap={8}>
				<Group gap="xs">
					<IconDownload />
					<Text>
						{isCDN ? 'CDN Hits' : 'Downloads'}:{' '}
						{hits ? millify(hits, { precision: 2 }) : 'N/A'}
					</Text>
				</Group>
				<Group gap="xs">
					<IconEdit />
					<Text>Last Modified: {metadata.lastModified}</Text>
				</Group>
				<Group className={classes['button-group']} justify="space-between" grow>
					{metadata.variable ? (
						<DetailsPopover
							ariaLabel="Open GitHub source links"
							icon={<IconGithub />}
							label="Github"
							links={[
								{
									ariaLabel: 'Open variable GitHub source',
									href: `https://github.com/fontsource/font-files/tree/main/fonts/${
										metadata.category === 'icons'
											? 'variable-icons'
											: 'variable'
									}/${metadata.id}`,
									label: 'Variable',
								},
								{
									ariaLabel: 'Open static GitHub source',
									href: staticSourceUrl,
									label: 'Static',
								},
							]}
						/>
					) : (
						<UnstyledButton
							component="a"
							aria-label="Open GitHub source"
							className={classes.button}
							href={staticSourceUrl}
							target="_blank"
							rel="noreferrer"
						>
							<Group className={classes['button-content']} gap="xs">
								<IconGithub />
								Github
							</Group>
						</UnstyledButton>
					)}
					{metadata.variable ? (
						<DetailsPopover
							ariaLabel="Open NPM package links"
							icon={<IconNpm />}
							label="NPM"
							links={[
								{
									ariaLabel: 'Open variable NPM package',
									href: `https://www.npmjs.com/package/@fontsource-variable/${metadata.id}`,
									label: 'Variable',
								},
								{
									ariaLabel: 'Open static NPM package',
									href: `https://www.npmjs.com/package/@fontsource/${metadata.id}`,
									label: 'Static',
								},
							]}
						/>
					) : (
						<UnstyledButton
							component="a"
							aria-label="Open NPM package"
							className={classes.button}
							href={`https://www.npmjs.com/package/@fontsource/${metadata.id}`}
							target="_blank"
							rel="noreferrer"
						>
							<Group className={classes['button-content']} gap="xs">
								<IconNpm />
								NPM
							</Group>
						</UnstyledButton>
					)}
				</Group>
			</Stack>
		</div>
	);
};
