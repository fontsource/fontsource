import { MantineProvider } from '@mantine/core';
import {
	type ActionFunctionArgs,
	createMemoryRouter,
	RouterProvider,
} from 'react-router';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { commands } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import { CollectionsProvider } from '@/features/collections/CollectionsProvider';
import { deferred } from '@/test/deferred';
import { CurrentProjectPage } from './CurrentProjectPage';
import { CurrentProjectProvider } from './CurrentProjectProvider';
import type { ResolvedFontSetFamily } from './model';

const families: ResolvedFontSetFamily[] = ['Inter', 'Poppins'].map(
	(family) => ({
		familyId: family.toLowerCase(),
		family,
		classification: 'sans-serif',
		packageName: `@fontsource/${family.toLowerCase()}`,
		packageVersion: '5.3.0',
		fontFamily: family,
		license: { id: 'OFL-1.1' },
	}),
);

declare module 'vitest/browser' {
	interface BrowserCommands {
		stubFontStylesheets(): Promise<void>;
	}
}

beforeEach(async () => {
	await commands.stubFontStylesheets();
	localStorage.clear();
	localStorage.setItem(
		'fontsource.font-set',
		JSON.stringify(families.map(({ familyId }) => ({ familyId }))),
	);
});
afterEach(async () => {
	await cleanup();
	localStorage.clear();
});

async function renderFontSet(action: (args: ActionFunctionArgs) => unknown) {
	const router = createMemoryRouter(
		[
			{ path: '/selected-fonts', element: <CurrentProjectPage /> },
			{ path: '/resources/font-set-items', action },
		],
		{ initialEntries: ['/selected-fonts'] },
	);
	return render(
		<MantineProvider>
			<CollectionsProvider>
				<CurrentProjectProvider>
					<RouterProvider router={router} />
				</CurrentProjectProvider>
			</CollectionsProvider>
		</MantineProvider>,
	);
}

async function resolveFamilies({ request }: ActionFunctionArgs) {
	const form = await request.formData();
	return {
		requestId: form.get('requestId'),
		items: families.filter(({ familyId }) =>
			form.getAll('fontId').includes(familyId),
		),
		failedIds: [],
	};
}

it('hydrates saved fonts, persists remove/undo, and renders complete developer output', async () => {
	const screen = await renderFontSet(resolveFamilies);
	await expect
		.element(screen.getByRole('button', { name: 'Download all (.zip)' }))
		.toBeEnabled();
	await screen
		.getByRole('button', { name: 'Remove Inter from font set' })
		.click();
	await expect
		.element(screen.getByRole('button', { name: 'Remove Inter from font set' }))
		.not.toBeInTheDocument();
	await expect
		.poll(() => localStorage.getItem('fontsource.font-set'))
		.toBe(JSON.stringify([{ familyId: 'poppins' }]));
	await screen.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect
		.element(screen.getByRole('button', { name: 'Remove Inter from font set' }))
		.toBeVisible();
	await expect
		.poll(() => localStorage.getItem('fontsource.font-set'))
		.toBe(JSON.stringify([{ familyId: 'inter' }, { familyId: 'poppins' }]));
	await screen.getByRole('tab', { name: 'Developer setup' }).click();
	await expect
		.element(
			screen
				.getByRole('region', { name: 'Apply the fonts code' })
				.getByRole('code'),
		)
		.toHaveTextContent(
			'.font-inter { font-family: "Inter"; } .font-poppins { font-family: "Poppins"; }',
		);
	await expect
		.element(
			screen
				.getByRole('region', { name: 'Import fonts code' })
				.getByRole('code'),
		)
		.toHaveTextContent(
			'import "@fontsource/inter"; import "@fontsource/poppins";',
		);
});

it('keeps unavailable rows and disables output until retry resolves the complete set', async () => {
	let incomplete = true;
	const screen = await renderFontSet(async (args) => {
		const result = await resolveFamilies(args);
		return incomplete
			? { ...result, items: [families[0]], failedIds: ['poppins'] }
			: result;
	});
	await expect.element(screen.getByRole('alert')).toBeVisible();
	await expect
		.element(
			screen.getByRole('button', { name: 'Remove Poppins from font set' }),
		)
		.toBeVisible();
	await expect
		.element(screen.getByRole('button', { name: 'Download all (.zip)' }))
		.toBeDisabled();
	await screen.getByRole('tab', { name: 'Developer setup' }).click();
	await expect
		.element(screen.getByRole('region', { name: 'Apply the fonts code' }))
		.not.toBeInTheDocument();
	incomplete = false;
	await screen.getByRole('button', { name: 'Try again' }).click();
	await expect
		.element(screen.getByRole('region', { name: 'Apply the fonts code' }))
		.toBeVisible();
	await screen.getByRole('tab', { name: 'Download files' }).click();
	await expect
		.element(screen.getByRole('button', { name: 'Download all (.zip)' }))
		.toBeEnabled();
});

it('withholds stale output while the changed selection is loading', async () => {
	const pending = deferred();
	let requests = 0;
	const screen = await renderFontSet(async (args) => {
		const result = await resolveFamilies(args);
		if (++requests > 1) await pending.promise;
		return result;
	});
	await expect
		.element(screen.getByRole('button', { name: 'Download all (.zip)' }))
		.toBeEnabled();
	await screen
		.getByRole('button', { name: 'Remove Inter from font set' })
		.click();
	await expect
		.element(screen.getByRole('button', { name: 'Download all (.zip)' }))
		.toBeDisabled();
	await screen.getByRole('tab', { name: 'Developer setup' }).click();
	await expect
		.element(screen.getByRole('region', { name: 'Apply the fonts code' }))
		.not.toBeInTheDocument();
	pending.resolve();
	await expect
		.element(
			screen
				.getByRole('region', { name: 'Apply the fonts code' })
				.getByRole('code'),
		)
		.toHaveTextContent('.font-poppins { font-family: "Poppins"; }');
	await expect
		.element(
			screen
				.getByRole('region', { name: 'Import fonts code' })
				.getByRole('code'),
		)
		.toHaveTextContent('import "@fontsource/poppins";');
	await screen.getByRole('tab', { name: 'Download files' }).click();
	await expect
		.element(screen.getByRole('button', { name: 'Download all (.zip)' }))
		.toBeEnabled();
});
