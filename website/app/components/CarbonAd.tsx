import type { BoxProps } from '@mantine/core';
import { Box } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import Balancer from 'react-wrap-balancer';

import classes from './CarbonAd.module.css';

type CarbonWindow = typeof window & {
	_carbonads?: { refresh(): void };
};

// Carbon finds its insertion point by a global script ID after its request
// completes. Keep that host connected and never refresh it concurrently.
let carbonHost: HTMLSpanElement | undefined;
let isRefreshing = false;
let refreshQueued = false;

const getCarbonHost = () => {
	carbonHost ??= document.createElement('span');
	return carbonHost;
};

const refreshCarbonAd = () => {
	const host = getCarbonHost();
	isRefreshing = true;

	const observer = new MutationObserver(() => {
		if (host.querySelector('.carbon-wrap')) completeRefresh();
	});
	function completeRefresh() {
		observer.disconnect();

		if (refreshQueued) {
			refreshQueued = false;
			refreshCarbonAd();
			return;
		}

		isRefreshing = false;
	}

	observer.observe(host, { childList: true, subtree: true });

	const carbon = (window as CarbonWindow)._carbonads;
	if (carbon) {
		carbon.refresh();
		return;
	}

	const script = document.createElement('script');
	script.src =
		'//cdn.carbonads.com/carbon.js?serve=CEAI42QN&placement=fontsourceorg';
	script.id = '_carbonads_js';
	script.async = true;
	script.onerror = () => {
		script.remove();
		completeRefresh();
	};
	host.appendChild(script);
};

interface CarbonAdProps extends BoxProps {
	layout?: 'vertical' | 'horizontal';
	slotClassName?: string;
}

export const CarbonAd = ({
	layout = 'vertical',
	className,
	slotClassName,
	...props
}: CarbonAdProps) => {
	const { pathname } = useLocation();
	const mountRef = useRef<HTMLSpanElement>(null);
	const desktop = useMediaQuery('(min-width: 1201px)');
	const shouldLoad = !slotClassName || desktop;

	// biome-ignore lint/correctness/useExhaustiveDependencies: Refresh the ad when the tab route changes.
	useEffect(() => {
		if (!shouldLoad) return;
		const host = getCarbonHost();
		host.hidden = false;
		mountRef.current?.appendChild(host);

		if (isRefreshing) {
			refreshQueued = true;
		} else {
			refreshCarbonAd();
		}

		return () => {
			host.hidden = true;
			document.body.appendChild(host);
		};
	}, [pathname, shouldLoad]);

	const ad = (
		<Box
			{...props}
			className={clsx(classes.wrapper, className)}
			data-layout={layout}
		>
			{layout === 'vertical' ? (
				<Balancer>
					<span ref={mountRef} />
				</Balancer>
			) : (
				<span ref={mountRef} />
			)}
		</Box>
	);

	return slotClassName ? (
		<aside
			className={clsx(classes.slot, slotClassName)}
			data-layout={layout}
			aria-label="Advertisement"
		>
			{ad}
		</aside>
	) : (
		ad
	);
};
