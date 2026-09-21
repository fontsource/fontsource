import { MantineProvider } from '@mantine/core';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { FontCard } from './FontCard';

const renderCard = (eagerStylesheet: boolean) =>
	renderToStaticMarkup(
		<MantineProvider>
			<MemoryRouter>
				<FontCard
					font={{
						id: 'inter',
						family: 'Inter',
						defSubset: 'latin',
						category: 'sans-serif',
						variable: true,
					}}
					size={32}
					eagerStylesheet={eagerStylesheet}
				/>
			</MemoryRouter>
		</MantineProvider>,
	);

describe('catalogue preview font loading', () => {
	it('discovers eager font CSS without blocking the server-rendered page', () => {
		const html = renderCard(true);
		expect(html).toContain(
			'<link rel="preload" as="style" href="https://cdn.jsdelivr.net/fontsource/css/inter@latest/index.css"',
		);
		expect(html).not.toContain('rel="stylesheet"');
		expect(html).toContain('href="/fonts/inter"');
	});

	it('leaves other preview stylesheets undiscovered until needed', () => {
		expect(renderCard(false)).not.toContain(
			'https://cdn.jsdelivr.net/fontsource/css/',
		);
	});
});
