import type { SnapshotConfig } from 'boneyard-js';
import { type ReactNode, useMemo } from 'react';

import { Skeleton, type SkeletonName } from '@/components/Skeleton';
import { useIsFontReady } from '@/hooks/useIsFontLoaded';

interface FontSkeletonProps {
	name: SkeletonName;
	family: string;
	weight?: number;
	weights?: number[];
	style?: string;
	className?: string;
	snapshotConfig?: SnapshotConfig;
	children: ReactNode;
}

export const FontSkeleton = ({
	name,
	family,
	weight,
	weights,
	style = 'normal',
	className,
	snapshotConfig,
	children,
}: FontSkeletonProps) => {
	const observedWeights = useMemo(
		() => weights ?? (weight === undefined ? undefined : [weight]),
		[weight, weights],
	);
	const ready = useIsFontReady(family, true, {
		weights: observedWeights,
		style,
	});

	return (
		<Skeleton
			name={name}
			loading={!ready}
			className={className}
			snapshotConfig={snapshotConfig}
		>
			{children}
		</Skeleton>
	);
};
