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

		expect(html).toMatchInlineSnapshot(
			`"<h3 id="story">Story</h3><p>A <strong>friendly</strong> font.</p><p>&lt;script&gt;alert(1)&lt;/script&gt;</p>"`,
		);
		expect(html).not.toContain('<script>');
	});

	it('renders inline registry prose without a wrapper element', () => {
		const html = renderToStaticMarkup(
			<RegistryMarkdown inline value={'A **friendly** font.'} />,
		);

		expect(html).toMatchInlineSnapshot(`"A <strong>friendly</strong> font."`);
	});

	it('renders links as text for non-interactive summaries', () => {
		const html = renderToStaticMarkup(
			<RegistryMarkdown
				inline
				links={false}
				value={'Made by [Type Foundry](https://example.com).'}
			/>,
		);

		expect(html).toMatchInlineSnapshot(`"Made by <span>Type Foundry</span>."`);
	});
});
