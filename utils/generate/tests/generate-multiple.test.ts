import { describe, expect, it } from 'vitest';

import { generateMulti } from '../src';


describe('generateMulti', () => {
	it('should generate a multi font-face', () => {
		const font = {
			family: 'Open Sans',
			id: 'open-sans',
			styles: ['normal', 'italic'],
			display: 'swap',
			weights: [400, 700],
			subsets: ['latin', 'latin-ext'],
			formats: ['woff2', 'woff', 'ttf']
		};

		const result = generateMulti(font);
		expect(result).toMatchSnapshot();
	});

	it('should generate a multi font-face with different display', () => {
		const font = {
			family: 'Open Sans',
			id: 'open-sans',
			styles: ['normal', 'italic'],
			display: 'optional',
			weights: [400, 700],
			subsets: ['latin', 'latin-ext'],
			formats: ['woff2', 'woff', 'ttf']
		};

		const result = generateMulti(font);
		expect(result).toMatchSnapshot();
	});

	it('should generate a multi font-face with additional path', () => {
		const font = {
			family: 'Open Sans',
			id: 'open-sans',
			styles: ['normal', 'italic'],
			display: 'swap',
			weights: [400, 700],
			subsets: ['latin', 'latin-ext'],
			formats: ['woff2', 'woff', 'ttf'],
			path: './fonts/'
		};

		const result = generateMulti(font);
		expect(result).toMatchSnapshot();
	});

	it('should generate with unicode range', () => {
		const font = {
			family: 'Open Sans',
			id: 'open-sans',
			styles: ['normal', 'italic'],
			display: 'swap',
			weights: [400, 700],
			subsets: ['latin', 'latin-ext'],
			formats: ['woff2', 'woff', 'ttf'],
			unicodeRange: {
				'latin': 'U+000-5FF',
				'latin-ext': 'U+000-5FF2'
			}
		};

		const result = generateMulti(font);
		expect(result).toMatchSnapshot();
	});

	it('should generate a multi font-face with all variable', () => {
		const font = {
			family: 'Open Sans',
			id: 'open-sans',
			styles: ['normal'],
			display: 'swap',
			weights: [100, 700, 900],
			subsets: ['latin', 'latin-ext'],
			formats: ['woff2', 'woff', 'ttf'],
			variable: {
				wght: [100, 700, 900],
				stretch: {
					min: 50,
					max: 200
				},
				slnt: {
					min: -10,
					max: 20
				}
			}
		};

		const result = generateMulti(font);
		expect(result).toMatchSnapshot();
	});
});
