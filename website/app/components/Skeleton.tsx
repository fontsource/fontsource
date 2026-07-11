import docsSearchResultsBones from '@/bones/docs-search-results.bones.json';
import fontPreviewRowBones from '@/bones/font-preview-row.bones.json';
import searchHitPreviewBones from '@/bones/search-hit-preview.bones.json';
import {
	normalizeBone,
	type ResponsiveBones,
	type SkeletonResult,
} from 'boneyard-js';
import { Skeleton as BoneyardSkeleton } from 'boneyard-js/react';
import {
	type ReactNode,
	useEffect,
	useState,
	useSyncExternalStore,
} from 'react';
import { useLocation } from 'react-router';

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

const viewportListeners = new Set<() => void>();
const notifyViewportListeners = () => {
	for (const listener of viewportListeners) listener();
};
const subscribeToViewport = (listener: () => void) => {
	if (viewportListeners.size === 0) {
		window.addEventListener('resize', notifyViewportListeners);
	}

	viewportListeners.add(listener);
	return () => {
		viewportListeners.delete(listener);
		if (viewportListeners.size === 0) {
			window.removeEventListener('resize', notifyViewportListeners);
		}
	};
};
const getViewportBreakpoint = () =>
	window.innerWidth >= 1280 ? '1280' : window.innerWidth >= 768 ? '768' : '375';
const getServerViewportBreakpoint = () => '375' as const;

const useSkeletonLoading = (loading: boolean) => {
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		setHydrated(true);
	}, []);

	return !hydrated || loading;
};

const FontPreviewSkeletonFixture = () => {
	return (
		<div className={classes['font-preview-fixture']}>
			<span />
		</div>
	);
};

const SearchHitSkeletonFixture = () => {
	return (
		<div className={classes['search-hit-fixture']}>
			<span />
			<span />
			<span />
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
	const location = useLocation();
	const viewportBreakpoint = useSyncExternalStore(
		subscribeToViewport,
		getViewportBreakpoint,
		getServerViewportBreakpoint,
	);
	const fixture = getFixture(name);
	const isCaptureRoute =
		import.meta.env.DEV && new URLSearchParams(location.search).has('boneyard');

	if (isCaptureRoute) {
		return (
			<div data-boneyard={name} style={{ position: 'relative' }}>
				<div>{fixture ?? children}</div>
			</div>
		);
	}

	return (
		<BoneyardSkeleton
			name={name}
			loading={showSkeleton}
			initialBones={skeletons[name].breakpoints[viewportBreakpoint]}
			fallback={<Fallback name={name} />}
			fixture={fixture}
			animate="pulse"
			color={skeletonColor}
		>
			{children}
		</BoneyardSkeleton>
	);
};
