interface FileGenerator {
	id: string;
	subsets: string[];
	weights: number[];
	styles: string[];
}

// We need to make a POST request to the download worker
const createRequest = (
	request: Request,
	{ id, subsets, weights, styles }: FileGenerator
) => {
	const newRequestInit = {
		method: 'POST',
		body: JSON.stringify({ id, subsets, weights, styles }),
		headers: {
			'Content-Type': 'application/json',
		},
	};

	return new Request(request.clone(), newRequestInit);
};

const getOrUpdateZip = async (
	request: Request,
	data: FileGenerator,
	env: Env
) => {
	// Check if download.zip exists in bucket
	const zip = await env.BUCKET.get(`${data.id}@latest/download.zip`);
	if (!zip) {
		// Try calling download worker
		await env.DOWNLOAD.fetch(createRequest(request, data));
		// Check again if download.zip exists in bucket
		return await env.BUCKET.get(`${data.id}@latest/download.zip`);
	}
	return zip;
};

const getOrUpdateFile = async (
	request: Request,
	data: FileGenerator,
	file: string,
	env: Env
) => {
	// Check if file exists in bucket
	const font = await env.BUCKET.get(`${data.id}@latest/${file}`);
	if (!font) {
		// Try calling download worker
		await env.DOWNLOAD.fetch(createRequest(request, data));
		// Check again if file exists in bucket
		return await env.BUCKET.get(`${data.id}@latest/${file}`);
	}
	return font;
};

export { getOrUpdateFile, getOrUpdateZip };
