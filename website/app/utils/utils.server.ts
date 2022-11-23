import type { HTTPError } from 'ky';
import ky from 'ky';

interface KyaOpts {
	text?: boolean;
}

// The error handling on ky is not too informative, so we change it up a little
export const kya = async (url: string, opts?: KyaOpts) => {
	const data = ky(url, {
		hooks: {
			beforeError: [
				(error: HTTPError) => {
					const { response } = error;
					if (response && response.body) {
						error.name = 'HTTPError';
						// @ts-ignore
						error.message = `Failed to fetch ${url} with ${response.body.message} (${response.status})`;
					}

					return error;
				},
			],
		},
	});

	if (opts?.text) return data.text() as any;

	return data.json() as any;
};
