import posthog from 'posthog-js';
import { StrictMode, startTransition } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { isRouteErrorResponse } from 'react-router';
import { HydratedRouter } from 'react-router/dom';
import { posthogHost, posthogProjectToken } from '@/utils/posthog';

if (import.meta.env.PROD) {
	posthog.init(posthogProjectToken, {
		api_host: posthogHost,
		ui_host: 'https://eu.posthog.com',
		defaults: '2026-05-30',
		cookieless_mode: 'always',
		autocapture: true,
		capture_pageview: 'history_change',
		disable_session_recording: true,
		disable_surveys: true,
		capture_performance: { web_vitals: true, network_timing: false },
		capture_exceptions: true,
		capture_heatmaps: true,
		capture_dead_clicks: true,
		advanced_disable_flags: true,
	});
}

startTransition(() => {
	hydrateRoot(
		document,
		<StrictMode>
			<HydratedRouter
				onError={(error, { pattern, errorInfo }) => {
					if (!import.meta.env.PROD) return;
					if (isRouteErrorResponse(error) && error.status < 500) return;
					posthog.captureException(error, {
						source: 'react-router',
						route: pattern,
						componentStack: errorInfo?.componentStack,
					});
				}}
			/>
		</StrictMode>,
		{
			onRecoverableError(error, errorInfo) {
				console.error(error);
				if (import.meta.env.PROD) {
					posthog.captureException(error, {
						source: 'react-hydration',
						componentStack: errorInfo.componentStack,
					});
				}
			},
		},
	);
});
