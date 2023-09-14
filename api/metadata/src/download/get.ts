import { type StatusErrorObject } from 'common-api/types';
import { StatusError } from 'itty-router';

const getOrUpdateZip = async (tag: string, req: Request, env: Env) => {
	// Check if download.zip exists in bucket
	const zip = await env.BUCKET.get(`${tag}/download.zip`);
	if (!zip) {
		// Try calling download worker
		const url = new URL(req.url);
		url.pathname = `/v1/download/${tag}`;
		const newRequest = new Request(url.toString(), {
			...req.clone(),
			method: 'POST',
		});

		const resp = await env.DOWNLOAD.fetch(newRequest);
		if (!resp.ok) {
			const error = await resp.json<StatusErrorObject>();

			throw new StatusError(
				500,
				`Bad response from download worker. ${error.error}`,
			);
		}

		// Check again if download.zip exists in bucket
		const zip = await env.BUCKET.get(`${tag}/download.zip`);
		return zip;
	}
	return zip;
};

const getOrUpdateFile = async (
	tag: string,
	file: string,
	req: Request,
	env: Env,
) => {
	// Check if file exists in bucket
	const font = await env.BUCKET.get(`${tag}/${file}`);
	if (!font) {
		// Try calling download worker
		// Try calling download worker
		const url = new URL(req.url);
		url.pathname = `/v1/download/${tag}/${file}`;
		const newRequest = new Request(url.toString(), {
			...req.clone(),
			method: 'POST',
		});

		const resp = await env.DOWNLOAD.fetch(newRequest);
		if (!resp.ok) {
			const error = await resp.json<StatusErrorObject>();

			throw new StatusError(
				500,
				`Bad response from download worker. ${error.error}`,
			);
		}
		// Check again if file exists in bucket
		const zip = await env.BUCKET.get(`${tag}/${file}`);
		return zip;
	}
	return font;
};

export { getOrUpdateFile, getOrUpdateZip };
