import { Box, Group, Text, Title } from '@mantine/core';
import { Link, useLocation } from 'react-router';

import { IconDownload } from '@/components/icons';
import { AddToCollectionMenu } from '@/features/collections/AddToCollectionMenu';
import { FavoriteButton } from '@/features/collections/FavoriteButton';
import type { GetFontResponse } from '@/generated/api';
import { getFontFamilyStack } from '@/utils/font-preview';
import { isSymbolFontFamily, type RegistryFamily } from '@/utils/registry';

import classes from './Tabs.module.css';

type FamilyTab = 'preview' | 'glyphs' | 'about' | 'use';
type FontPageLocationState = { fontResults?: string };

interface TabWrapperProps {
	metadata: GetFontResponse;
	registry?: RegistryFamily;
	variableAvailable?: boolean;
	tabsValue: string;
	children: React.ReactNode;
}

const tabs: Array<{ label: string; value: FamilyTab; suffix: string }> = [
	{ label: 'Preview', value: 'preview', suffix: '' },
	{ label: 'Glyphs', value: 'glyphs', suffix: '/glyphs' },
	{ label: 'About', value: 'about', suffix: '/about' },
	{ label: 'Get font', value: 'use', suffix: '/use' },
];

const categoryNames: Record<GetFontResponse['category'], string> = {
	'sans-serif': 'Sans serif',
	serif: 'Serif',
	display: 'Display',
	handwriting: 'Handwriting',
	monospace: 'Monospace',
	icons: 'Icons',
	other: 'Other',
};

const sourceNames: Record<GetFontResponse['type'], string> = {
	google: 'Google Fonts',
	league: 'The League of Moveable Type',
	icons: 'Icon family',
	other: 'Open source',
};

const getRegistryDescription = (registry?: RegistryFamily) => {
	if (!registry?.content) return;
	return (
		registry.content.en?.description ??
		Object.values(registry.content).find((content) => content.description)
			?.description
	);
};

export const FamilyIdentity = ({
	metadata,
	registry,
	fontFamily,
	compact = false,
}: {
	metadata: GetFontResponse;
	registry?: RegistryFamily;
	fontFamily: string;
	compact?: boolean;
}) => {
	const category = categoryNames[metadata.category];
	const weightLabel = `${metadata.weights.length} ${metadata.weights.length === 1 ? 'weight' : 'weights'}`;
	const subsetLabel = `${metadata.subsets.length} ${metadata.subsets.length === 1 ? 'subset' : 'subsets'}`;
	const description = getRegistryDescription(registry);
	const attribution = registry?.designer;
	const classification =
		registry?.classifications[0]?.replaceAll('-', ' ') ?? category;
	const tags = registry?.tags.slice(0, 2) ?? [];
	const useSpecimenTitle = registry
		? !isSymbolFontFamily(registry)
		: metadata.category !== 'icons' && metadata.category !== 'other';

	return (
		<div className={classes.identity} data-compact={compact || undefined}>
			<Title
				order={1}
				className={classes.title}
				id="family-title"
				style={useSpecimenTitle ? { fontFamily } : undefined}
			>
				{registry?.displayName ?? metadata.family}
			</Title>
			{compact ? (
				<div className={classes.compactMetadata}>
					<span>{classification}</span>
					<span>{metadata.variable ? 'Variable' : 'Static'}</span>
					<span>{weightLabel}</span>
				</div>
			) : (
				<>
					<Text className={classes.description}>
						{description ??
							`A ${category.toLowerCase()} family with ${weightLabel} and ${subsetLabel}.`}
					</Text>
					<Text className={classes.source}>
						{attribution ? (
							<>
								Designed by <span>{attribution}</span>
							</>
						) : (
							<>
								Source: <span>{sourceNames[metadata.type]}</span>
							</>
						)}
					</Text>
					<div className={classes.metadata}>
						<span>{classification}</span>
						<span>{metadata.variable ? 'Variable' : 'Static'}</span>
						<span>{weightLabel}</span>
					</div>
					{tags.length > 0 && (
						<ul className={classes.tags}>
							{tags.map((tag) => (
								<li key={tag}>
									<Link
										to={`/?query=${encodeURIComponent(tag.split('/').at(-1)?.replaceAll('-', ' ') ?? tag)}`}
									>
										{tag.split('/').at(-1)?.replaceAll('-', ' ') ?? tag}
									</Link>
								</li>
							))}
						</ul>
					)}
				</>
			)}
		</div>
	);
};

export const FamilyActions = ({
	metadata,
	compact = false,
	secondaryAction,
	showGetFont = true,
}: {
	metadata: GetFontResponse;
	compact?: boolean;
	secondaryAction?: React.ReactNode;
	showGetFont?: boolean;
}) => {
	const location = useLocation();
	const fontSummary = {
		id: metadata.id,
		family: metadata.family,
		defSubset: metadata.defSubset,
		category: metadata.category,
		variable: metadata.variable,
	};

	return (
		<Group
			className={classes.actions}
			data-has-secondary={secondaryAction ? true : undefined}
			gap="sm"
			wrap="nowrap"
		>
			<div className={classes.utilityActions}>
				<FavoriteButton font={fontSummary} withLabel={!compact} />
				<AddToCollectionMenu font={fontSummary} />
			</div>
			{secondaryAction && (
				<div className={classes.secondaryAction}>{secondaryAction}</div>
			)}
			{showGetFont && (
				<Link
					className={classes.getFont}
					to={`/fonts/${metadata.id}/use`}
					state={location.state}
				>
					<IconDownload aria-hidden height={18} stroke="currentColor" />
					Get font
				</Link>
			)}
		</Group>
	);
};

export const FamilyTabs = ({
	activeTab,
	metadata,
	contained = false,
}: {
	activeTab: string;
	metadata: GetFontResponse;
	contained?: boolean;
}) => {
	const location = useLocation();

	return (
		<nav
			className={classes.tabBar}
			aria-label={`${metadata.family} pages`}
			data-contained={contained || undefined}
		>
			<div className={classes.tabList}>
				{tabs.map((tab) => (
					<Link
						key={tab.value}
						to={`/fonts/${metadata.id}${tab.suffix}`}
						state={location.state}
						className={classes.tab}
						data-active={activeTab === tab.value || undefined}
						aria-current={activeTab === tab.value ? 'page' : undefined}
						prefetch="intent"
					>
						{tab.label}
					</Link>
				))}
			</div>
		</nav>
	);
};

export const TabsWrapper = ({
	metadata,
	registry,
	variableAvailable,
	tabsValue,
	children,
}: TabWrapperProps) => {
	const activeTab = ['install', 'cdn', 'download'].includes(tabsValue)
		? 'use'
		: tabsValue === 'characters'
			? 'glyphs'
			: tabsValue;
	const isPreview = activeTab === 'preview';
	const fontFamily = getFontFamilyStack(metadata, variableAvailable, registry);
	const location = useLocation();
	const locationState = location.state as FontPageLocationState | null;
	const resultsUrl =
		typeof locationState?.fontResults === 'string'
			? locationState.fontResults
			: '/';

	return (
		<Box
			className={classes.shell}
			data-preview={isPreview || undefined}
			data-m:load={`view-tab=${tabsValue}`}
		>
			<div className={classes.backBar}>
				<Link to={resultsUrl}>← Back to results</Link>
			</div>

			{!isPreview && (
				<section
					className={classes.compactHeader}
					aria-labelledby="family-title"
				>
					<FamilyIdentity
						metadata={metadata}
						registry={registry}
						fontFamily={fontFamily}
						compact
					/>
					<FamilyActions
						metadata={metadata}
						compact
						showGetFont={activeTab !== 'use'}
					/>
				</section>
			)}

			{!isPreview && <FamilyTabs activeTab={activeTab} metadata={metadata} />}

			{registry?.status === 'deprecated' && (
				<div className={classes.statusNotice} role="status">
					<strong>This family is no longer actively maintained.</strong>
					<span>
						You can still inspect and download the published files.
						{registry.replacedBy ? (
							<>
								{' '}
								<Link to={`/fonts/${registry.replacedBy}`}>
									Open the recommended replacement
								</Link>
								.
							</>
						) : (
							' Check the source project before starting new work.'
						)}
					</span>
				</div>
			)}

			{children}
		</Box>
	);
};
