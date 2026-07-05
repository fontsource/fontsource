import docsSearchResultsBones from '@/bones/docs-search-results.bones.json';
import fontPreviewRowBones from '@/bones/font-preview-row.bones.json';
import searchHitPreviewBones from '@/bones/search-hit-preview.bones.json';
import {
	normalizeBone,
	type ResponsiveBones,
	type SkeletonResult,
} from 'boneyard-js';
import { Skeleton as BoneyardSkeleton } from 'boneyard-js/react';
import { type ReactNode, useEffect, useState } from 'react';

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

const getSkeletonVariants = (bones: ResponsiveBones) =>
	Object.entries(bones.breakpoints)
		.sort(([left], [right]) => Number(left) - Number(right))
		.map(([breakpoint, skeleton]) => ({ breakpoint, skeleton }));

const useSkeletonLoading = (loading: boolean) => {
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		setHydrated(true);
	}, []);

	return !hydrated || loading;
};

const FontPreviewSkeletonFixture = () => {
	const viewportWidth = typeof window === 'undefined' ? 375 : window.innerWidth;
	const lineWidth =
		viewportWidth >= 1280 ? '80%' : viewportWidth >= 768 ? '82%' : '86%';

	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				width: '100%',
				height: 58,
			}}
		>
			<span
				style={{
					display: 'block',
					width: lineWidth,
					height: 30,
					borderRadius: 4,
				}}
			/>
		</div>
	);
};

const SearchHitSkeletonFixture = () => {
	const viewportWidth = typeof window === 'undefined' ? 375 : window.innerWidth;
	const isWide = viewportWidth >= 1280;
	const isGrid = viewportWidth >= 768;
	const lineWidths = isGrid
		? [isWide ? '70%' : '74%']
		: ['92%', '84%', '72%', '58%'];

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				gap: isGrid ? 0 : 16,
				justifyContent: isGrid ? 'center' : undefined,
				width: isWide ? 244 : isGrid ? 276 : 327,
				maxWidth: '100%',
				height: isGrid ? 42 : 252,
				paddingTop: isGrid ? 0 : 4,
			}}
		>
			{lineWidths.map((width) => (
				<span
					key={width}
					style={{
						display: 'block',
						width,
						height: 30,
						borderRadius: 4,
					}}
				/>
			))}
		</div>
	);
};

const getFixture = (name: SkeletonName) => {
	if (!import.meta.env.DEV) return undefined;

	switch (name) {
		case 'font-preview-row':
			return <FontPreviewSkeletonFixture />;
		case 'search-hit-preview':
			return <SearchHitSkeletonFixture />;
		default:
			return undefined;
	}
};

const Bone = ({
	bone,
	skeleton,
}: {
	bone: SkeletonResult['bones'][number];
	skeleton: SkeletonResult;
}) => {
	const normalized = normalizeBone(bone);

	if (normalized.c) return null;

	const capturedPxWidth = (normalized.w / 100) * (skeleton.width ?? 0);
	const isCircle =
		normalized.r === '50%' && Math.abs(capturedPxWidth - normalized.h) < 4;

	return (
		<div
			style={{
				position: 'absolute',
				left: `${normalized.x}%`,
				top: normalized.y,
				width: isCircle ? normalized.h : `${normalized.w}%`,
				height: normalized.h,
				borderRadius:
					typeof normalized.r === 'string' ? normalized.r : `${normalized.r}px`,
				backgroundColor: skeletonColor,
			}}
		/>
	);
};

const Fallback = ({ name }: { name: SkeletonName }) => (
	<div className={classes.fallback} aria-hidden="true">
		{getSkeletonVariants(skeletons[name]).map(({ breakpoint, skeleton }) => (
			<div
				key={breakpoint}
				data-boneyard-fallback-variant={breakpoint}
				style={{
					position: 'relative',
					width: '100%',
					height: skeleton.height,
				}}
			>
				{skeleton.bones.map((bone, index) => (
					<Bone
						// biome-ignore lint/suspicious/noArrayIndexKey: Bones are static generated geometry.
						key={index}
						bone={bone}
						skeleton={skeleton}
					/>
				))}
			</div>
		))}
	</div>
);

export const Skeleton = ({ name, loading, children }: SkeletonProps) => {
	const showSkeleton = useSkeletonLoading(loading);

	return (
		<BoneyardSkeleton
			name={name}
			loading={showSkeleton}
			fallback={<Fallback name={name} />}
			fixture={getFixture(name)}
			animate="pulse"
			color={skeletonColor}
		>
			{children}
		</BoneyardSkeleton>
	);
};
