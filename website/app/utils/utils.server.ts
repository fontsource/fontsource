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
					if (response?.body) {
						error.name = 'HTTPError';
						error.message = `Failed to fetch ${url} with ${
							// @ts-expect-error - Message doesn't apparently exist on readable stream
							response.body.message as string
						} (${response.status})`;
					}

					return error;
				},
			],
		},
	});

	// biome-ignore lint/suspicious/noExplicitAny: Selective.
	if (opts?.text) return data.text() as any;

	// biome-ignore lint/suspicious/noExplicitAny: Selective.
	return data.json() as any;
};

// We need know if a variable font may be a standard or variable font
const STANDARD_AXES = ['opsz', 'slnt', 'wdth', 'wght'] as const;
type StandardAxes = (typeof STANDARD_AXES)[number];

export const isStandardAxesKey = (axesKey: string): axesKey is StandardAxes =>
	STANDARD_AXES.includes(axesKey as StandardAxes);
