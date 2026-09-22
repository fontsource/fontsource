import { PostHog } from 'posthog-node';

export async function captureApiError(
	error: unknown,
	properties: Record<string, string>,
): Promise<void> {
	if (!import.meta.env.PROD) return;

	try {
		// Public project token, shared with the website. One client per error avoids
		// sharing request-scoped I/O across Worker invocations.
		const posthog = new PostHog(
			'phc_uBg2yEfqQmKYBHvceqQ7BbXgBg6xnNV6Y7PCtVvN4k5H',
			{
				host: 'https://eu.i.posthog.com',
				flushInterval: 0,
				requestTimeout: 5000,
				fetchRetryCount: 1,
				disableGeoip: true,
			},
		);
		await posthog.captureExceptionImmediate(error, undefined, {
			...properties,
			source: 'api-worker',
			environment: import.meta.env.MODE,
			$process_person_profile: false,
		});
	} catch (captureError) {
		console.error('Failed to report API error to PostHog', captureError);
	}
}
