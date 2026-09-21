import { PostHog } from 'posthog-node';
import { isRouteErrorResponse } from 'react-router';
import { posthogHost, posthogProjectToken } from './posthog';

export async function captureServerError(error: unknown, request: Request) {
	if (!import.meta.env.PROD || request.signal.aborted) return;
	if (isRouteErrorResponse(error) && error.status < 500) return;
	if (error instanceof Response && error.status < 500) return;

	try {
		// One client per error; immediate capture is awaited by the Worker's waitUntil.
		const posthog = new PostHog(posthogProjectToken, {
			host: posthogHost,
			flushInterval: 0,
			requestTimeout: 5000,
			fetchRetryCount: 1,
			disableGeoip: true,
		});
		posthog.on('error', (captureError) => {
			console.error('Failed to report server error to PostHog', captureError);
		});
		await posthog.captureExceptionImmediate(error, undefined, {
			source: 'website-server',
			pathname: new URL(request.url).pathname,
			method: request.method,
			$process_person_profile: false,
		});
	} catch (captureError) {
		console.error('Failed to report server error to PostHog', captureError);
	}
}
