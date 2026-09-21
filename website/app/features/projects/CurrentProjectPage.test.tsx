import { MantineProvider } from '@mantine/core';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { CollectionsProvider } from '@/features/collections/CollectionsProvider';
import { CurrentProjectPage } from './CurrentProjectPage';
import { useCurrentProjectStore } from './CurrentProjectProvider';
import type { ResolvedFontSetFamily } from './model';
import { createCurrentProjectStore } from './store';

const fetcher = vi.hoisted(() => ({
	state: 'idle',
	data: undefined as unknown,
	submit: vi.fn(),
}));

vi.mock('react-router', async (original) => ({
	...(await original<typeof import('react-router')>()),
	useFetcher: () => fetcher,
}));
vi.mock('./CurrentProjectProvider', async (original) => ({
	...(await original<typeof import('./CurrentProjectProvider')>()),
	useCurrentProjectStore: vi.fn(),
}));

const inter: ResolvedFontSetFamily = {
	familyId: 'inter',
	family: 'Inter',
	classification: 'sans-serif',
	packageName: '@fontsource-variable/inter',
	packageVersion: '5.3.0',
	fontFamily: 'Inter Variable',
	license: { id: 'OFL-1.1' },
};
const poppins: ResolvedFontSetFamily = {
	...inter,
	familyId: 'poppins',
	family: 'Poppins',
	packageName: '@fontsource/poppins',
	fontFamily: 'Poppins',
};

const render = (
	response: {
		requestId: string;
		items: ResolvedFontSetFamily[];
		failedIds: string[];
	},
	url = '/selected-fonts',
) => {
	const store = createCurrentProjectStore([
		{ familyId: 'inter' },
		{ familyId: 'poppins' },
	]);
	store.ready$.set(true);
	vi.mocked(useCurrentProjectStore).mockReturnValue(store);
	fetcher.data = response;
	return renderToStaticMarkup(
		<MantineProvider>
			<MemoryRouter initialEntries={[url]}>
				<CollectionsProvider>
					<CurrentProjectPage />
				</CollectionsProvider>
			</MemoryRouter>
		</MantineProvider>,
	);
};

describe('font set output readiness', () => {
	it.each([
		{ requestId: 'inter,poppins:0', items: [inter], failedIds: ['poppins'] },
		{ requestId: 'inter:0', items: [inter], failedIds: [] },
	])(
		'keeps every selected row but disables incomplete or stale outputs',
		(response) => {
			const html = render(response);
			expect(html).toContain('Remove Inter from font set');
			expect(html).toContain('Remove Poppins from font set');
			const download = html
				.match(/<button\b[^>]*>[\s\S]*?<\/button>/g)
				?.find((button) => button.includes('Download all'));
			expect(download).toContain('disabled');
			expect(render(response, '/selected-fonts?view=website')).not.toContain(
				'Apply the fonts',
			);
		},
	);

	it('enables the complete set and includes the CSS application step', () => {
		const response = {
			requestId: 'inter,poppins:0',
			items: [inter, poppins],
			failedIds: [],
		};
		const html = render(response);
		const download = html
			.match(/<button\b[^>]*>[\s\S]*?<\/button>/g)
			?.find((button) => button.includes('Download all'));
		expect(download).toBeDefined();
		expect(download).not.toContain('disabled');
		expect(render(response, '/selected-fonts?view=website')).toContain(
			'Apply the fonts',
		);
	});
});
