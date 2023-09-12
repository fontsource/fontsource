import { type StatusErrorObject } from 'common-api/types';
import { StatusError } from 'itty-router';

const ACCEPTED_EXTENSIONS = ['woff2', 'woff', 'ttf', 'otf'] as const;
type AcceptedExtension = (typeof ACCEPTED_EXTENSIONS)[number];

export const isAcceptedExtension = (
	extension: string,
): extension is AcceptedExtension =>
	ACCEPTED_EXTENSIONS.includes(extension as AcceptedExtension);

// Download specified version from download worker
export const downloadVersion = async (
	id: string,
	version: string,
	req: Request,
	env: Env,
) => {
	const apiPathname = `/v1/${id}@${version}`;
	const url = new URL(req.url);
	url.pathname = apiPathname;

	const newRequest = new Request(url.toString(), { ...req, method: 'POST' });

	const response = await env.DOWNLOAD.fetch(newRequest);
	if (!response.ok) {
		const error = await response.json<StatusErrorObject>();
		throw new StatusError(
			response.status,
			`Bad response from download worker. ${error.error}`,
		);
	}
};

export const downloadFile = async (
	id: string,
	version: string,
	file: string,
	req: Request,
	env: Env,
) => {
	const apiPathname = `/v1/${id}@${version}/${file}`;
	const url = new URL(req.url);
	url.pathname = apiPathname;

	const newRequest = new Request(url.toString(), { ...req, method: 'POST' });

	const response = await env.DOWNLOAD.fetch(newRequest);
	if (!response.ok) {
		const error = await response.json<StatusErrorObject>();
		throw new StatusError(
			response.status,
			`Bad response from download worker. ${error.error}`,
		);
	}
};
