import { describe, expect, it } from 'vitest';

import { generateSingle } from '../src';

describe('generateSingle', () => {
	it('should generate a single font-face', () => {
		const font = {
			family: 'Open Sans',
			style: 'normal',
			display: 'swap',
			weight: 400,
			src: [{
				url: './fonts/open-sans-v17-latin-regular.woff2',
				format: 'woff2',
			}],
		};

		const result = generateSingle(font);
		expect(result).toMatchSnapshot();

	});

	it('should generate a single font face with multiple formats', () => {
		const font = {
			family: 'Open Sans',
			style: 'normal',
			display: 'swap',
			weight: 400,
			src: [{
				url: './fonts/open-sans-v17-latin-regular.woff2',
				format: 'woff2',
			}, {
				url: './fonts/open-sans-v17-latin-regular.woff',
				format: 'woff',
			}],
		};

		const result = generateSingle(font);
		expect(result).toMatchSnapshot();
	});

	it('should generate a single font face with different display', () => {
		const font = {
			family: 'Open Sans',
			style: 'normal',
			display: 'optional',
			weight: 400,
			src: [{
				url: './fonts/open-sans-v17-latin-regular.woff2',
				format: 'woff2',
			}],
		};

		const result = generateSingle(font);
		expect(result).toMatchSnapshot();
	});

	it('should generate a single font face with unicode range', () => {
		const font = {
			family: 'Open Sans',
			style: 'normal',
			display: 'swap',
			weight: 400,
			src: [{
				url: './fonts/open-sans-v17-latin-regular.woff2',
				format: 'woff2',
			}],
			unicodeRange: 'U+000-5FF',
			comment: 'latin'
		};

		const result = generateSingle(font);
		expect(result).toMatchSnapshot();
	});

	it('should generate a single font face with variable wght', () => {
		const font = {
			family: 'Open Sans',
			style: 'normal',
			display: 'swap',
			weight: 400,
			src: [{
				url: './fonts/open-sans-v17-latin-regular.woff2',
				format: 'woff2',
			}],
			variable: {
				wght: [400, 500, 700]
			}
		};

		const result = generateSingle(font);
		expect(result).toMatchSnapshot();
	});

	it('should generate a single font face with font stretch', () => {
		const font = {
			family: 'Open Sans',
			style: 'normal',
			display: 'swap',
			weight: 400,
			src: [{
				url: './fonts/open-sans-v17-latin-regular.woff2',
				format: 'woff2',
			}],
			variable: {
				stretch: {
					min: 50,
					max: 200
				}
			}
		};

		const result = generateSingle(font);
		expect(result).toMatchSnapshot();
	});

	it('should generate a single font face with slnt axis', () => {
		const font = {
			family: 'Open Sans',
			style: 'normal',
			display: 'swap',
			weight: 400,
			src: [{
				url: './fonts/open-sans-v17-latin-regular.woff2',
				format: 'woff2',
			}],
			variable: {
				slnt: {
					min: -10,
					max: 20
				}
			}
		};

		const result = generateSingle(font);
		expect(result).toMatchSnapshot();
	});

	it('should generate a single font face with all variable axis', () => {
		const font = {
			family: 'Open Sans',
			style: 'normal',
			display: 'swap',
			weight: 400,
			src: [{
				url: './fonts/open-sans-v17-latin-regular.woff2',
				format: 'woff2',
			}],
			variable: {
				wght: [400, 500, 600, 700],
				slnt: {
					min: -15,
					max: 25
				},
				stretch: {
					min: 55,
					max: 250
				}
			},
			unicodeRange: 'U+000-5FF',
			comment: 'latin'
		};

		const result = generateSingle(font);
		expect(result).toMatchSnapshot();
	});
});