import posthog from 'posthog-js';
import { StrictMode, startTransition } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HydratedRouter } from 'react-router/dom';

if (import.meta.env.PROD) {
	// Public project token, not a personal API key.
	posthog.init('phc_uBg2yEfqQmKYBHvceqQ7BbXgBg6xnNV6Y7PCtVvN4k5H', {
		api_host: 'https://eu.i.posthog.com',
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
			<HydratedRouter />
		</StrictMode>,
	);
});
