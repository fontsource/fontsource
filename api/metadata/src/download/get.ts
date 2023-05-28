const getOrUpdateZip = async (id: string, env: Env) => {
	// Check if download.zip exists in bucket
	const zip = await env.BUCKET.get(`${id}@latest/download.zip`);
	if (!zip) {
		// Try calling download worker
		await env.DOWNLOAD.fetch(new Request(`/download/${id}`));
		// Check again if download.zip exists in bucket
		return await env.BUCKET.get(`${id}@latest/download.zip`);
	}
	return zip;
};

const getOrUpdateFile = async (id: string, file: string, env: Env) => {
	// Check if file exists in bucket
	const font = await env.BUCKET.get(`${id}@latest/${file}`);
	if (!font) {
		// Try calling download worker
		await env.DOWNLOAD.fetch(new Request(`/download/${id}`));
		// Check again if file exists in bucket
		return await env.BUCKET.get(`${id}@latest/${file}`);
	}
	return font;
};

export { getOrUpdateZip, getOrUpdateFile };
