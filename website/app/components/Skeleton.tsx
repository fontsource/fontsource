import { useMounted } from '@mantine/hooks';
import { renderBones } from 'boneyard-js';
import { Skeleton as BoneyardSkeleton } from 'boneyard-js/react';
import type { ReactNode } from 'react';
import docsSearchResultsBones from '@/bones/docs-search-results.bones.json';
import fontPreviewRowBones from '@/bones/font-preview-row.bones.json';
import searchHitPreviewBones from '@/bones/search-hit-preview.bones.json';

import classes from './Skeleton.module.css';

const skeletonColor =
	'light-dark(var(--mantine-color-background-2), var(--mantine-color-border-1))';

const skeletons = {
	'docs-search-results': docsSearchResultsBones,
	'font-preview-row': fontPreviewRowBones,
	'search-hit-preview': searchHitPreviewBones,
} as const;

type SkeletonName = keyof typeof skeletons;

interface SkeletonProps {
	name: SkeletonName;
	loading: boolean;
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

export const Skeleton = ({ name, loading, children }: SkeletonProps) => {
	const mounted = useMounted();

	return (
		<BoneyardSkeleton
			name={name}
			loading={!mounted || loading}
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
