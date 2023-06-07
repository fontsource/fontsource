import { createStylesServer, injectStyles } from '@mantine/remix';
import type { EntryContext, HandleDataRequestFunction } from '@remix-run/node';
import { RemixServer } from '@remix-run/react';
import { renderToString } from 'react-dom/server';

import { getFlyReplayResponse, getInstanceInfo } from '@/utils/fly.server';

const server = createStylesServer();

export default async function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	remixContext: EntryContext
) {
	if (process.env.FLY) {
		const { primaryInstance, currentIsPrimary } = await getInstanceInfo();
		// 409 indicates db writes, which should only be done on primary
		if (responseStatusCode === 409 && !currentIsPrimary) {
			return await getFlyReplayResponse(primaryInstance);
		}
	}

	const markup = renderToString(
		<RemixServer context={remixContext} url={request.url} />
	);
	responseHeaders.set('Content-Type', 'text/html');

	return new Response(`<!DOCTYPE html>${injectStyles(markup, server)}`, {
		status: responseStatusCode,
		headers: responseHeaders,
	});
}

export const handleDataRequest: HandleDataRequestFunction = async (
	response: Response
) => {
	if (process.env.FLY) {
		const { currentInstance, primaryInstance, currentIsPrimary } =
			await getInstanceInfo();

		if (response.status === 409 && !currentIsPrimary) {
			return await getFlyReplayResponse(primaryInstance);
		}

		response.headers.set('fly-region', process.env.FLY_REGION ?? 'unknown');
		response.headers.set('fly-primary-instance', primaryInstance ?? 'unknown');
		response.headers.set('fly-instance', currentInstance);
	}
	return response;
};
