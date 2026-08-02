import { useMounted } from '@mantine/hooks';
import { renderBones, type SnapshotConfig } from 'boneyard-js';
import { Skeleton as BoneyardSkeleton } from 'boneyard-js/react';
import type { ReactNode } from 'react';
import docsSearchResultsBones from '@/bones/docs-search-results.bones.json';
import fontDetailAboutSpecimenBones from '@/bones/font-detail-about-specimen.bones.json';
import fontDetailCanvasBones from '@/bones/font-detail-canvas.bones.json';
import fontDetailCompactTitleBones from '@/bones/font-detail-compact-title.bones.json';
import fontDetailGlyphExplorerBones from '@/bones/font-detail-glyph-explorer.bones.json';
import fontDetailTitleBones from '@/bones/font-detail-title.bones.json';
import fontDetailWeightStripBones from '@/bones/font-detail-weight-strip.bones.json';
import fontPreviewRowBones from '@/bones/font-preview-row.bones.json';
import searchHitPreviewBones from '@/bones/search-hit-preview.bones.json';

import classes from './Skeleton.module.css';

const skeletonColor =
	'light-dark(var(--mantine-color-background-2), var(--mantine-color-border-1))';

const skeletons = {
	'docs-search-results': docsSearchResultsBones,
	'font-detail-about-specimen': fontDetailAboutSpecimenBones,
	'font-detail-canvas': fontDetailCanvasBones,
	'font-detail-compact-title': fontDetailCompactTitleBones,
	'font-detail-glyph-explorer': fontDetailGlyphExplorerBones,
	'font-detail-title': fontDetailTitleBones,
	'font-detail-weight-strip': fontDetailWeightStripBones,
	'font-preview-row': fontPreviewRowBones,
	'search-hit-preview': searchHitPreviewBones,
} as const;

export type SkeletonName = keyof typeof skeletons;

interface SkeletonProps {
	name: SkeletonName;
	loading: boolean;
	className?: string;
	snapshotConfig?: SnapshotConfig;
	children: ReactNode;
}

const getFixture = (name: SkeletonName) => {
	if (!import.meta.env.DEV) return undefined;

	switch (name) {
		case 'font-preview-row':
			return (
				<div className={classes['font-preview-fixture']}>
					<span />
				</div>
			);
		case 'search-hit-preview':
			return (
				<div className={classes['search-hit-fixture']}>
					<span />
					<span />
					<span />
				</div>
			);
		default:
			return undefined;
	}
};

const Fallback = ({ name }: { name: SkeletonName }) => (
	<div className={classes.fallback} aria-hidden="true">
		{Object.entries(skeletons[name].breakpoints).map(
			([breakpoint, skeleton]) => (
				<div
					key={breakpoint}
					data-boneyard-fallback-variant={breakpoint}
					// biome-ignore lint/security/noDangerouslySetInnerHtml: Boneyard only receives committed skeleton JSON.
					dangerouslySetInnerHTML={{
						__html: renderBones(skeleton, skeletonColor, false),
					}}
				/>
			),
		)}
	</div>
);

export const Skeleton = ({
	name,
	loading,
	className,
	snapshotConfig,
	children,
}: SkeletonProps) => {
	const mounted = useMounted();

	return (
		<BoneyardSkeleton
			name={name}
			loading={!mounted || loading}
			className={className}
			snapshotConfig={snapshotConfig}
			initialBones={skeletons[name]}
			select="viewport"
			fallback={<Fallback name={name} />}
			fixture={getFixture(name)}
			animate="pulse"
			color={skeletonColor}
		>
			{children}
		</BoneyardSkeleton>
	);
};
