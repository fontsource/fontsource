import { StatusError } from 'itty-router';

export const updateZip = async (tag: string, env: Env) => {
	// Try calling download worker
	const req = new Request(`https://download.fontsource.org/${tag}`, {
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
	let retries = 0;
	let zip = await env.FONTS.get(`${tag}/download.zip`);
	while (!zip && retries < 3) {
		zip = await env.FONTS.get(`${tag}/download.zip`);
		retries++;
		// Exponential backoff
		await new Promise((resolve) => setTimeout(resolve, retries * 300));
	}

	if (!zip) {
		throw new StatusError(
			500,
			'Internal Server Error. Failed to update zip file.',
		);
	}

	return zip;
};

export const updateFile = async (tag: string, file: string, env: Env) => {
	// Try calling download worker
	const req = new Request(`https://download.fontsource.org/${tag}/${file}`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.UPLOAD_KEY}`,
		},
	});

	const resp = await fetch(req);
	if (resp.status !== 201) {
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
	let retries = 0;
	let font = await env.FONTS.get(`${tag}/${file}`);
	while (!font && retries < 3) {
		font = await env.FONTS.get(`${tag}/${file}`);
		retries++;
		// Exponential backoff
		await new Promise((resolve) => setTimeout(resolve, retries * 300));
	}

	if (!font) {
		throw new StatusError(500, 'Internal Server Error. Failed to update file.');
	}

	return font;
};

export const updateVariableFile = async (
	tag: string,
	file: string,
	env: Env,
) => {
	// Try calling download worker
	const req = new Request(`https://download.fontsource.org/v/${tag}/${file}`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.UPLOAD_KEY}`,
		},
	});

	const resp = await fetch(req);
	if (resp.status !== 201) {
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
	let retries = 0;
	let font = await env.FONTS.get(`${tag}/variable/${file}`);
	while (!font && retries < 3) {
		font = await env.FONTS.get(`${tag}/variable/${file}`);
		retries++;
		// Exponential backoff
		await new Promise((resolve) => setTimeout(resolve, retries * 300));
	}

	if (!font) {
		throw new StatusError(500, 'Internal Server Error. Failed to update file.');
	}

	return font;
};
