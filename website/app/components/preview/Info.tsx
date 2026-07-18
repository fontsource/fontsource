import {
	Divider,
	Group,
	Menu,
	Stack,
	Text,
	UnstyledButton,
} from '@mantine/core';
import type { KeyboardEvent, ReactNode } from 'react';
import {
	IconCaret,
	IconDownload,
	IconEdit,
	IconGithub,
	IconNpm,
} from '@/components/icons';
import type { GetFontResponse } from '@/generated/api';

import classes from './Info.module.css';

const compactNumberFormatter = new Intl.NumberFormat('en', {
	notation: 'compact',
	maximumFractionDigits: 2,
});

interface InfoProps {
	metadata: GetFontResponse;
	isCDN?: boolean;
	hits?: number;
}

interface DetailsMenuItem {
	ariaLabel: string;
	href: string;
	label: string;
}

interface DetailsMenuProps {
	ariaLabel: string;
	icon: ReactNode;
	items: DetailsMenuItem[];
	label: string;
}

const getSourcePath = (
	metadata: GetFontResponse,
	variant: 'static' | 'variable',
) => {
	if (metadata.category === 'icons') {
		return variant === 'variable' ? 'variable-icons' : 'icons';
	}

	if (variant === 'variable') {
		return metadata.type === 'google' ? 'variable' : metadata.type;
	}

	return metadata.type;
};

const handleMenuTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
	if (event.key === 'Enter' || event.key === ' ') {
		event.preventDefault();
		event.currentTarget.click();
	}
};

const DetailsMenu = ({ ariaLabel, icon, items, label }: DetailsMenuProps) => (
	<Menu
		shadow="none"
		width="target"
		position="bottom-start"
		offset={4}
		menuItemTabIndex={0}
		classNames={{
			dropdown: classes['link-menu'],
			item: classes['link-menu-item'],
		}}
	>
		<Menu.Target>
			<UnstyledButton
				aria-label={ariaLabel}
				className={classes.button}
				onKeyDown={handleMenuTriggerKeyDown}
				type="button"
			>
				<Group className={classes['button-content']} gap="xs">
					{icon}
					{label}
					<IconCaret className={classes.caret} />
				</Group>
			</UnstyledButton>
		</Menu.Target>
		<Menu.Dropdown>
			{items.map((item) => (
				<Menu.Item
					key={item.href}
					component="a"
					aria-label={item.ariaLabel}
					href={item.href}
					target="_blank"
					rel="noreferrer"
				>
					{item.label}
				</Menu.Item>
			))}
		</Menu.Dropdown>
	</Menu>
);

export const InfoWrapper = ({ metadata, isCDN, hits }: InfoProps) => {
	const staticSourceUrl = `https://github.com/fontsource/font-files/tree/main/fonts/${getSourcePath(metadata, 'static')}/${metadata.id}`;
	const variableSourceUrl = `https://github.com/fontsource/font-files/tree/main/fonts/${getSourcePath(metadata, 'variable')}/${metadata.id}`;

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
						{hits ? compactNumberFormatter.format(hits) : 'N/A'}
					</Text>
				</Group>
				<Group gap="xs">
					<IconEdit />
					<Text>Last Modified: {metadata.lastModified}</Text>
				</Group>
				<Group className={classes['button-group']} justify="space-between" grow>
					{metadata.variable ? (
						<DetailsMenu
							ariaLabel="Open GitHub source links"
							icon={<IconGithub />}
							label="Github"
							items={[
								{
									ariaLabel: 'Open variable GitHub source',
									href: variableSourceUrl,
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
						<DetailsMenu
							ariaLabel="Open NPM package links"
							icon={<IconNpm />}
							label="NPM"
							items={[
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
