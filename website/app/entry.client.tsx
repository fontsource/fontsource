import { StrictMode, startTransition } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HydratedRouter } from 'react-router/dom';

startTransition(() => {
	hydrateRoot(
		document,
		<StrictMode>
			<HydratedRouter />
		</StrictMode>,
	);
});

if (import.meta.env.PROD) {
	const loadAnalytics = () => {
		import('posthog-js')
			.then(({ default: posthog }) => {
				// Public project token, not a personal API key.
				posthog.init('phc_uBg2yEfqQmKYBHvceqQ7BbXgBg6xnNV6Y7PCtVvN4k5H', {
					api_host: 'https://eu.i.posthog.com',
					defaults: '2026-05-30',
					cookieless_mode: 'always',
					autocapture: true,
					capture_pageview: 'history_change',
					disable_session_recording: true,
					disable_surveys: true,
					capture_performance: false,
					capture_exceptions: false,
					capture_heatmaps: false,
					capture_dead_clicks: false,
					advanced_disable_flags: true,
				});
			})
			.catch((error: unknown) => {
				console.warn('Unable to load analytics', error);
			});
	};

	const scheduleAnalytics = () => {
		if ('requestIdleCallback' in window) {
			window.requestIdleCallback(loadAnalytics, { timeout: 2000 });
		} else {
			setTimeout(loadAnalytics, 0);
		}
	};

	if (document.readyState === 'complete') {
		scheduleAnalytics();
	} else {
		window.addEventListener('load', scheduleAnalytics, { once: true });
	}
}
