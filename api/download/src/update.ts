import JSZip from 'jszip';

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

const updateBucket = async (data: any, env: Env) => {
	// Generate zip file of all fonts
	const zip = new JSZip();
	const webfonts = zip.folder('webfonts');

	// Add all individual font files to the bucket
	for (const weight of data.weights) {
		for (const style of data.styles) {
			for (const subset of data.subsets) {
				for (const extension of ['woff2', 'woff']) {
					// For now we only push to latest tag
					const urlMetadata: URLMetadata = {
						id: data.id,
						subset,
						weight,
						style,
						extension,
					};

					const url = getFileUrl(urlMetadata, 'latest');
					const buffer = await fetch(url).then((res) => res.arrayBuffer());

					// Add to zip file
					if (!webfonts) throw new Error('could not generate webfonts folder');
					webfonts.file(
						`${data.id}-${subset}-${weight}-${style}.${extension}`,
						buffer
					);

					// Add to bucket
					await env.BUCKET.put(
						`${data.id}@latest/${subset}-${weight}-${style}.${extension}`,
						buffer
					);
				}
			}
		}
	}

	// Add zip file to bucket
	const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });
	await env.BUCKET.put(`${data.id}@latest/download.zip`, zipBuffer);
};

export { updateBucket };
