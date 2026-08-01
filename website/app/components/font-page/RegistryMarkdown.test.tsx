import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RegistryMarkdown } from './RegistryMarkdown';

describe('RegistryMarkdown', () => {
	it('renders registry prose during SSR without allowing raw HTML', () => {
		const html = renderToStaticMarkup(
			<RegistryMarkdown
				value={'## Story\n\nA **friendly** font.\n\n<script>alert(1)</script>'}
			/>,
		);

		expect(html).toContain('<h3 id="story">Story</h3>');
		expect(html).toContain('<strong>friendly</strong>');
		expect(html).not.toContain('<script>');
	});

	it('renders inline registry prose without a wrapper element', () => {
		const html = renderToStaticMarkup(
			<RegistryMarkdown inline value={'A **friendly** font.'} />,
		);

		expect(html).toBe('A <strong>friendly</strong> font.');
	});

	it('renders links as text for non-interactive summaries', () => {
		const html = renderToStaticMarkup(
			<RegistryMarkdown
				inline
				links={false}
				value={'Made by [Type Foundry](https://example.com).'}
			/>,
		);

		expect(html).toBe('Made by <span>Type Foundry</span>.');
	});
});
