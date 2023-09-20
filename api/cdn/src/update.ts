import { StatusError } from 'itty-router';

export const updateZip = async (tag: string, env: Env) => {
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
	const zip = await env.FONTS.get(`${tag}/download.zip`);
	return zip;
};

export const updateFile = async (tag: string, file: string, env: Env) => {
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
		if (resp.status === 404) {
			throw new StatusError(resp.status, 'Not Found. File does not exist.');
		}
		const error = await resp.text();

		throw new StatusError(
			resp.status,
			`Bad response from download worker. ${error}`,
		);
	}
	// Check again if file exists in bucket
	const font = await env.FONTS.get(`${tag}/${file}`);
	return font;
};

export const updateVariableFile = async (
	tag: string,
	file: string,
	env: Env,
) => {
	// Try calling download worker
	const req = new Request(
		`https://fontsource.org/actions/download/v/${tag}/${file}`,
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${env.UPLOAD_KEY}`,
			},
		},
	);

	const resp = await fetch(req);
	if (!resp.ok) {
		if (resp.status === 404) {
			throw new StatusError(resp.status, 'Not Found. File does not exist.');
		}
		const error = await resp.text();

		throw new StatusError(
			resp.status,
			`Bad response from download worker. ${error}`,
		);
	}
	// Check again if file exists in bucket
	const font = await env.FONTS.get(`variable:${tag}/${file}`);
	return font;
};
