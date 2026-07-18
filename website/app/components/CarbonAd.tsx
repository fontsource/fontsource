import type { BoxProps } from '@mantine/core';
import { Box } from '@mantine/core';
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

export const CarbonAd = ({ ...props }: BoxProps) => {
	const { pathname } = useLocation();
	const mountRef = useRef<HTMLSpanElement>(null);

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

	return (
		<Box className={classes.wrapper} {...props}>
			<Balancer>
				<span ref={mountRef} />
			</Balancer>
		</Box>
	);
};
