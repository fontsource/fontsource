import { MantineProvider } from '@mantine/core';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { CarbonAd } from './CarbonAd';

describe('CarbonAd', () => {
	it.each(['horizontal', 'vertical'] as const)(
		'renders the %s placement slot before hydration or ad loading',
		(layout) => {
			const html = renderToStaticMarkup(
				<MemoryRouter>
					<MantineProvider>
						<CarbonAd layout={layout} slotClassName="placement" />
					</MantineProvider>
				</MemoryRouter>,
			);
			expect(html).toMatch(/<aside[^>]*class="[^"]*placement[^"]*"/);
			expect(html).toContain('aria-label="Advertisement"');
			expect(html).not.toContain('cdn.carbonads.com');
		},
	);
});
