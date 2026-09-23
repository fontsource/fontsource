import { Box, Group, Title } from '@mantine/core';
import { Link, NavLink, useLocation } from 'react-router';

import { IconDownload } from '@/components/icons';
import { AddToCollectionMenu } from '@/features/collections/AddToCollectionMenu';
import { FavoriteButton } from '@/features/collections/FavoriteButton';
import { ProjectAddButton } from '@/features/projects/ProjectAddButton';
import type { GetFontResponse, GetVariableFontResponse } from '@/generated/api';
import { formatFontLabel } from '@/utils/font-labels';
import {
	getFontFamilyStack,
	getFontPreviewFamily,
	registrySourcePreviewFamily,
} from '@/utils/font-preview';
import {
	getRegistryFamilyKind,
	getRegistrySourcePreviewStyle,
	type RegistryFamily,
	type RegistrySource,
} from '@/utils/registry';

import classes from './FamilyPageShell.module.css';
import { FontSkeleton } from './FontSkeleton';

type FamilyTab = 'preview' | 'glyphs' | 'about' | 'use';
type FontPageLocationState = { fontResults?: string };

interface FamilyPageShellProps {
	metadata: Omit<GetFontResponse, 'variants'>;
	registry: RegistryFamily;
	previewSource?: RegistrySource;
	variable?: GetVariableFontResponse;
	tabsValue: FamilyTab;
	children: React.ReactNode;
}

const tabs: Array<{ label: string; value: FamilyTab; suffix: string }> = [
	{ label: 'Preview', value: 'preview', suffix: '' },
	{ label: 'Glyphs', value: 'glyphs', suffix: '/glyphs' },
	{ label: 'About', value: 'about', suffix: '/about' },
	{ label: 'Get font', value: 'use', suffix: '/use' },
];

export const FamilyIdentity = ({
	metadata,
	registry,
	previewSource,
	variableAvailable = false,
}: {
	metadata: Omit<GetFontResponse, 'variants'>;
	registry: RegistryFamily;
	previewSource?: RegistrySource;
	variableAvailable?: boolean;
}) => {
	const sourcePreviewStyle = getRegistrySourcePreviewStyle(previewSource);
	const fontFamily = previewSource
		? `"${registrySourcePreviewFamily}", "Fallback Outline"`
		: getFontFamilyStack(metadata, variableAvailable, registry);
	const previewFamily = previewSource
		? registrySourcePreviewFamily
		: getFontPreviewFamily(metadata, variableAvailable);
	const category = formatFontLabel(metadata.category);
	const weightLabel = `${metadata.weights.length} ${metadata.weights.length === 1 ? 'weight' : 'weights'}`;
	const classification = registry.classifications[0]
		? formatFontLabel(registry.classifications[0])
		: category;
	const useSpecimenTitle =
		getRegistryFamilyKind(registry) === 'text' && registry.languages.length > 0;

	const title = (
		<Title
			order={1}
			className={classes.title}
			id="family-title"
			style={
				useSpecimenTitle ? { fontFamily, ...sourcePreviewStyle } : undefined
			}
		>
			{registry.displayName ?? metadata.family}
		</Title>
	);

	return (
		<div className={classes.identity}>
			<div className={classes.titleFrame}>
				{useSpecimenTitle ? (
					<FontSkeleton
						name="font-detail-compact-title"
						family={previewFamily}
						weight={sourcePreviewStyle.fontWeight ?? 500}
						style={sourcePreviewStyle.fontStyle}
					>
						{title}
					</FontSkeleton>
				) : (
					title
				)}
			</div>
			<div className={classes.compactMetadata}>
				<span>{classification}</span>
				<span>{metadata.variable ? 'Variable' : 'Static'}</span>
				<span>{weightLabel}</span>
			</div>
		</div>
	);
};

export const FamilyActions = ({
	metadata,
	registry,
	showGetFont = true,
}: {
	metadata: Omit<GetFontResponse, 'variants'>;
	registry: RegistryFamily;
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
		<Group className={classes.actions} gap="sm" wrap="wrap">
			<div className={classes.utilityActions}>
				<FavoriteButton font={fontSummary} withLabel={false} />
				<AddToCollectionMenu font={fontSummary} />
			</div>
			<ProjectAddButton
				displayName={registry.displayName ?? metadata.family}
				familyId={metadata.id}
				label="Add to font set"
				includedLabel="In font set"
			/>
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
	metadata: Omit<GetFontResponse, 'variants'>;
	registry: RegistryFamily;
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
	previewSource,
	variable,
	tabsValue,
	children,
}: FamilyPageShellProps) => {
	const isPreview = tabsValue === 'preview';
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
						previewSource={previewSource}
						variableAvailable={Boolean(variable)}
					/>
					<FamilyActions
						metadata={metadata}
						registry={registry}
						showGetFont={tabsValue !== 'use'}
					/>
				</section>
			)}

			{!isPreview && <FamilyTabs metadata={metadata} registry={registry} />}

			{registry.status === 'deprecated' && (
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
