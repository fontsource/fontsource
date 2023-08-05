import { expect, it } from 'vitest';

import { generateManifest } from '../src/util';

const describe = setupMiniflareIsolatedStorage();

describe('utils', () => {
	it('should generate valid manifest', async () => {
		const metadata = {
			weights: [400, 700],
			styles: ['normal', 'italic'],
			subsets: ['latin'],
			variable: false,
			unicodeRange: {
				latin: 'U+0000-00FF',
			},
		};

		const manifest = generateManifest('roboto@latest', metadata);
	});
});
