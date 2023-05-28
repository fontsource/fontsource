import { FontsourceMetadata } from '../types';
import { IDResponse } from './types';

const getFontId = async (id: string, url: URL, env: Env) => {
	const metadata = await env.FONTLIST.get<FontsourceMetadata>('metadata', {
		type: 'json',
	});
	if (!metadata) {
		return null;
	}

	// If ID does not exist in metadata, return 404

	let font: IDResponse;

	return new Response(
		`Not Found. Please refer to the Fontsource API documentation: https://fontsource.org/docs/api`,
		{ status: 404 }
	);
};
