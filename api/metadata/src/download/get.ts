import { StatusError } from 'itty-router';

const getOrUpdateZip = async (tag: string, env: Env) => {
	// Check if download.zip exists in bucket
	const zip = await env.BUCKET.get(`${tag}/download.zip`);
	if (!zip) {
		// Try calling download worker
		const req = new Request(`https://fontsource.org/actions/download/${tag}`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${env.UPLOAD_KEY}`,
			},
		});

		const resp = await fetch(req);
		if (!resp.ok) {
			const error = await resp.text();

			if (resp.status === 524) {
				throw new StatusError(
					resp.status,
					'Timeout from download worker. Please try again later as the package may be still downloading to our servers.',
				);
			}

			throw new StatusError(
				resp.status,
				`Bad response from download worker. ${error}`,
			);
		}

		// Check again if download.zip exists in bucket
		const zip = await env.BUCKET.get(`${tag}/download.zip`);
		return zip;
	}
	return zip;
};

const getOrUpdateFile = async (tag: string, file: string, env: Env) => {
	// Check if file exists in bucket
	const font = await env.BUCKET.get(`${tag}/${file}`);
	if (!font) {
		// Try calling download worker
		const req = new Request(
			`https://fontsource.org/actions/download/${tag}/${file}`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${env.UPLOAD_KEY}`,
				},
			},
		);

		const resp = await fetch(req);
		if (!resp.ok) {
			const error = await resp.text();

			throw new StatusError(
				resp.status,
				`Bad response from download worker. ${error}`,
			);
		}
		// Check again if file exists in bucket
		const font = await env.BUCKET.get(`${tag}/${file}`);
		return font;
	}
	return font;
};

export { getOrUpdateFile, getOrUpdateZip };
