import { type IDResponse } from 'common-api/types';
import { StatusError } from 'itty-router';

const ACCEPTED_EXTENSIONS = ['woff2', 'woff', 'ttf', 'otf'] as const;
type AcceptedExtension = (typeof ACCEPTED_EXTENSIONS)[number];

export const isAcceptedExtension = (
	extension: string,
): extension is AcceptedExtension =>
	ACCEPTED_EXTENSIONS.includes(extension as AcceptedExtension);

// Fetch latest metadata from metadata worker
export const getMetadata = async (id: string, req: Request, env: Env) => {
	const apiPathname = `/v1/fonts/${id}`;
	const url = new URL(req.url);
	url.pathname = apiPathname;

	// Update incoming request to use new pathname
	const newRequest = new Request(url.toString(), req);

	const metadata = await env.METADATA.fetch(newRequest);
	if (!metadata.ok) {
		throw new Error(
			`Bad response from metadata worker. Status: ${String(metadata.status)}`,
		);
	}

	return await metadata.json<IDResponse>();
};

// Download specified version from download worker
export const downloadVersion = async (
	id: string,
	version: string,
	req: Request,
	env: Env,
) => {
	const apiPathname = `/v1/fonts/${id}/${version}`;
	const url = new URL(req.url);
	url.pathname = apiPathname;
	console.log(apiPathname);

	const newRequest = new Request(url.toString(), req);

	const response = await env.DOWNLOAD.fetch(newRequest);
	if (!response.ok) {
		throw new StatusError(response.status,
			`Bad response from download worker. Status: ${String(response.status)}`,
		);
	}
};
