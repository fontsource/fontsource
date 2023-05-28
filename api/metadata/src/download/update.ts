import { getOrUpdateId } from '../fonts/get';

interface URLMetadata {
	id: string;
	subset: string;
	weight: number;
	style: string;
	extension: string;
}

const getFileUrl = (
	{ id, subset, weight, style, extension }: URLMetadata,
	npmVersion: string
) =>
	`https://cdn.jsdelivr.net/npm/@fontsource/${id}@${npmVersion}/files/${id}-${subset}-${weight}-${style}.${extension}`;

const updateBucket = async (id: string, env: Env) => {
	const data = await getOrUpdateId(id, env);

	if (!data) {
		return;
	}

	// Add all individual font files to the bucket
	for (const weight of data.weights) {
		for (const style of data.styles) {
			for (const subset of data.subsets) {
				for (const extension of ['woff2', 'woff']) {
					// For now we only push to latest tag
					const urlMetadata: URLMetadata = {
						id,
						subset,
						weight,
						style,
						extension,
					};

					const url = getFileUrl(urlMetadata, 'latest');
					const buffer = await fetch(url).then((res) => res.arrayBuffer());

					await env.BUCKET.put(
						`${id}@latest/${subset}-${weight}-${style}.${extension}`,
						buffer
					);
				}
			}
		}
	}

	// Generate zip file of all fonts
};
