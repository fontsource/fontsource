import { observe } from '@legendapp/state';
import { describe, expect, it } from 'vitest';

import type { ProjectItem } from './model';
import { currentProjectSnapshotSchema } from './model';
import { createCurrentProjectStore } from './store';

const fraunces: ProjectItem = {
	familyId: 'fraunces',
	family: 'Fraunces',
	displayName: 'Fraunces',
	category: 'serif',
	classification: 'serif',
	tags: ['soft-serif'],
	designer: 'Undercase Type',
	status: 'active',
	registryFactsCurrent: true,
	format: 'variable',
	subset: 'latin',
	style: 'normal',
	weight: 600,
	axes: { wght: 600, SOFT: 50 },
	packageName: '@fontsource-variable/fraunces',
	packageVersion: '5.2.8',
	cssFile: 'latin-wght-normal.css',
	fontFamily: 'Fraunces Variable',
	sampleText: 'Make something memorable.',
	symbolInputModes: [],
	license: {
		verified: true,
		id: 'OFL-1.1',
		url: 'https://openfontlicense.org',
	},
};

const createReadyStore = () => {
	const store = createCurrentProjectStore();
	store.ready$.set(true);
	return store;
};

describe('current project store', () => {
	it('keeps one configured setup per family', () => {
		const store = createReadyStore();
		let count = 0;
		const dispose = observe(() => {
			count = store.getItems().length;
		});

		expect(store.upsertItem(fraunces)).toBeUndefined();
		const previous = store.upsertItem({
			...fraunces,
			weight: 700,
			axes: { ...fraunces.axes, wght: 700 },
		});

		expect(previous).toEqual(fraunces);
		expect(count).toBe(1);
		expect(store.getItems()[0].weight).toBe(700);
		dispose();
	});

	it('removes individual families and clears the project', () => {
		const store = createReadyStore();
		store.upsertItem(fraunces);
		store.removeItem(fraunces.familyId);
		expect(store.getItems()).toEqual([]);

		store.upsertItem(fraunces);
		store.clear();
		expect(store.getItems()).toEqual([]);
	});

	it('rejects persisted duplicate family setups', () => {
		const result = currentProjectSnapshotSchema.safeParse({
			version: 1,
			items: [fraunces, { ...fraunces, weight: 700 }],
		});

		expect(result.success).toBe(false);
	});

	it('preserves exact package and registry license metadata', () => {
		const licensedItem = {
			...fraunces,
			cssFiles: ['latin-wght-normal.css', 'latin-wght-italic.css'],
			styles: ['normal', 'italic'] as const,
			weights: [400, 700],
			packageVersion: '5.3.1',
			status: 'deprecated' as const,
			license: {
				verified: true,
				id: 'LicenseRef-Example',
				url: 'https://example.com/license',
				attribution: 'Example Type',
			},
		};
		const snapshot = currentProjectSnapshotSchema.parse({
			version: 1,
			items: [licensedItem],
		});

		expect(snapshot.items[0]).toMatchObject({
			cssFiles: licensedItem.cssFiles,
			styles: licensedItem.styles,
			weights: licensedItem.weights,
			packageVersion: '5.3.1',
			status: 'deprecated',
			license: licensedItem.license,
		});
	});

	it('does not treat legacy saved license fields as registry verification', () => {
		const legacy = {
			...fraunces,
			registryFactsCurrent: undefined,
			symbolInputModes: undefined,
			license: {
				id: 'OFL-1.1',
				url: 'https://openfontlicense.org',
			},
		};
		const snapshot = currentProjectSnapshotSchema.parse({
			version: 1,
			items: [legacy],
		});

		expect(snapshot.items[0].license).toMatchObject({
			verified: false,
			id: 'OFL-1.1',
		});
		expect(snapshot.items[0]).toMatchObject({
			registryFactsCurrent: false,
			symbolInputModes: [],
		});
	});
});
