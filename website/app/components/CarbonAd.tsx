import type { BoxProps } from '@mantine/core';
import { Box } from '@mantine/core';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
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
	const [ready, setReady] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Refresh the ad when the tab route changes.
	useEffect(() => {
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
	}, [pathname]);

	useEffect(() => {
		if (!slotClassName) return;
		const mount = mountRef.current;
		if (!mount) return;
		const updateReady = () =>
			setReady(Boolean(mount.querySelector('.carbon-wrap')));
		const observer = new MutationObserver(updateReady);
		observer.observe(mount, { childList: true, subtree: true });
		updateReady();
		return () => observer.disconnect();
	}, [slotClassName]);

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
			data-ad-ready={ready}
			aria-label="Advertisement"
		>
			{ad}
		</aside>
	) : (
		ad
	);
};
