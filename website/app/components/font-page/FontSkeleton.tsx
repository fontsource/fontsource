import { type ReactNode, useMemo } from 'react';

import { Skeleton, type SkeletonName } from '@/components/Skeleton';
import { useFontPreview } from '@/hooks/useFontPreview';

interface FontSkeletonProps {
	name: SkeletonName;
	family: string;
	weight?: number;
	weights?: number[];
	style?: string;
	className?: string;
	children: ReactNode;
}

export const FontSkeleton = ({
	name,
	family,
	weight,
	weights,
	style = 'normal',
	className,
	children,
}: FontSkeletonProps) => {
	const observedWeights = useMemo(
		() => weights ?? (weight === undefined ? undefined : [weight]),
		[weight, weights],
	);
	const status = useFontPreview({
		family,
		weights: observedWeights,
		style,
	});

	return (
		<Skeleton name={name} loading={status === 'loading'} className={className}>
			{children}
		</Skeleton>
	);
};
