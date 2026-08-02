import { Box, Group, Text, Title } from '@mantine/core';
import { Link, NavLink, useLocation } from 'react-router';

import { IconDownload } from '@/components/icons';
import { AddToCollectionMenu } from '@/features/collections/AddToCollectionMenu';
import { FavoriteButton } from '@/features/collections/FavoriteButton';
import type { GetFontResponse } from '@/generated/api';
import { formatFontLabel } from '@/utils/font-labels';
import { getFontFamilyStack } from '@/utils/font-preview';
import {
	getRegistryContent,
	getRegistryFamilyKind,
	type RegistryFamily,
} from '@/utils/registry';

import classes from './FamilyPageShell.module.css';
import { RegistryMarkdown } from './RegistryMarkdown';

type FamilyTab = 'preview' | 'glyphs' | 'about' | 'use';
type FontPageLocationState = { fontResults?: string };

interface FamilyPageShellProps {
	metadata: GetFontResponse;
	registry?: RegistryFamily;
	variableAvailable?: boolean;
	tabsValue: FamilyTab;
	children: React.ReactNode;
}

const tabs: Array<{ label: string; value: FamilyTab; suffix: string }> = [
	{ label: 'Preview', value: 'preview', suffix: '' },
	{ label: 'Glyphs', value: 'glyphs', suffix: '/glyphs' },
	{ label: 'About', value: 'about', suffix: '/about' },
	{ label: 'Get font', value: 'use', suffix: '/use' },
];

const sourceNames: Record<GetFontResponse['type'], string> = {
	google: 'Google Fonts',
	league: 'The League of Moveable Type',
	icons: 'Icon family',
	other: 'Open source',
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
	const category = formatFontLabel(metadata.category);
	const weightLabel = `${metadata.weights.length} ${metadata.weights.length === 1 ? 'weight' : 'weights'}`;
	const subsetLabel = `${metadata.subsets.length} ${metadata.subsets.length === 1 ? 'subset' : 'subsets'}`;
	const description = getRegistryContent(registry)?.description;
	const descriptionSummary = description?.split(/\n\s*\n/, 1)[0]?.trim();
	const showDescriptionLink = Boolean(
		descriptionSummary && descriptionSummary.length > 180,
	);
	const attribution = registry?.designer;
	const classification = registry?.classifications[0]
		? formatFontLabel(registry.classifications[0])
		: category;
	const tags = registry?.tags.slice(0, 2) ?? [];
	const useSpecimenTitle = registry
		? getRegistryFamilyKind(registry) !== 'symbols'
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
					<p className={classes.description}>
						<RegistryMarkdown
							inline
							links={false}
							value={
								descriptionSummary ||
								`A ${category.toLowerCase()} family with ${weightLabel} and ${subsetLabel}.`
							}
						/>
					</p>
					{showDescriptionLink && (
						<Link
							className={classes.descriptionLink}
							to={`/fonts/${metadata.id}/about`}
						>
							Read more about {registry?.displayName ?? metadata.family}
						</Link>
					)}
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
							{tags.map((tag) => {
								const tagValue = tag.split('/').at(-1) ?? tag;
								return (
									<li key={tag}>
										<Link
											to={`/?query=${encodeURIComponent(tagValue.replaceAll('-', ' '))}`}
										>
											{formatFontLabel(tagValue)}
										</Link>
									</li>
								);
							})}
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
	showGetFont = true,
}: {
	metadata: GetFontResponse;
	compact?: boolean;
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
		<Group className={classes.actions} gap="sm" wrap="nowrap">
			<div className={classes.utilityActions}>
				<FavoriteButton font={fontSummary} withLabel={!compact} />
				<AddToCollectionMenu font={fontSummary} />
			</div>
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
	metadata,
	registry,
	contained = false,
}: {
	metadata: GetFontResponse;
	registry?: RegistryFamily;
	contained?: boolean;
}) => {
	const location = useLocation();
	const glyphsLabel =
		getRegistryFamilyKind(registry) === 'symbols' ? 'Symbols' : 'Glyphs';

	return (
		<nav
			className={classes.tabBar}
			aria-label={`${metadata.family} pages`}
			data-contained={contained || undefined}
		>
			<div className={classes.tabList}>
				{tabs.map((tab) => (
					<NavLink
						key={tab.value}
						to={`/fonts/${metadata.id}${tab.suffix}`}
						state={location.state}
						className={classes.tab}
						end={tab.value === 'preview'}
						prefetch="intent"
					>
						{tab.value === 'glyphs' ? glyphsLabel : tab.label}
					</NavLink>
				))}
			</div>
		</nav>
	);
};

export const FamilyPageShell = ({
	metadata,
	registry,
	variableAvailable,
	tabsValue,
	children,
}: FamilyPageShellProps) => {
	const isPreview = tabsValue === 'preview';
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
						showGetFont={tabsValue !== 'use'}
					/>
				</section>
			)}

			{!isPreview && <FamilyTabs metadata={metadata} registry={registry} />}

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
