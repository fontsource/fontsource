import {
	cancel,
	confirm,
	group,
	intro,
	multiselect,
	outro,
	select,
	text,
} from '@clack/prompts';
import { consola } from 'consola';
import colors from 'picocolors';

import { isCategoryName, type Metadata } from '../types';
import { licenseShort } from '../utils';
import { buildCustom } from './build';

export const create = async () => {
	intro(colors.cyan(colors.bold('fontsource')));
	const cfg = await group(
		{
			name: async () =>
				await text({
					message: colors.bold('What is the name of the font?'),
					placeholder: 'Noto Sans JP',
					validate(value) {
						if (!value) return 'Please enter a name';
						return;
					},
				}),
			// TODO: Add support for multiple subsets
			/*
		subsets: () => text({
			message: colors.bold('What are the subsets of the font? (separate by commas)'),
			placeholder: 'latin, latin-ext, japanese',
			validate(value) {
				if (!value) return 'Please enter at least one subset';
			}
		}), */
			weights: async () =>
				await text({
					message: colors.bold(
						'What are the weights of the font? (separate by commas)',
					),
					placeholder: '100, 200, 300, 400, 500, 600, 700, 800, 900',
					validate(value) {
						if (!value) return 'Please enter at least one weight';
						// Split array and check if all values are numbers
						const weights = value.split(',').map(Number);
						if (weights.some((weight) => Number.isNaN(weight)))
							return 'Please enter only numbers';
						return;
					},
				}),
			styles: async () =>
				await multiselect({
					message: colors.bold('What are the styles of the font?'),
					options: [
						{ value: 'normal', label: 'Normal' },
						{ value: 'italic', label: 'Italic' },
					],
					required: true,
				}),
			version: async () =>
				await text({
					message: colors.bold('What is the version of the font?'),
					placeholder: 'v1.0',
					validate(value) {
						if (!value) return 'Please enter a version';
						return;
					},
				}),
			category: async () =>
				await select({
					message: colors.bold('What is the category of the font?'),
					initialValue: 'sans-serif',
					options: [
						{ value: 'sans-serif', label: 'Sans Serif' },
						{ value: 'serif', label: 'Serif' },
						{ value: 'display', label: 'Display' },
						{ value: 'monospace', label: 'Monospace' },
						{ value: 'handwriting', label: 'Handwriting' },
						{ value: 'icons', label: 'Icons' },
						{ value: 'other', label: 'Other' },
					],
				}),
			license: async () =>
				await select({
					message: colors.bold('What is the license of the font?'),
					initialValue: 'sil open font license, 1.1',
					options: [
						{
							value: 'sil open font license, 1.1',
							label: 'SIL Open Font License (OFL-1.1)',
						},
						{
							value: 'apache license, version 2.0',
							label: 'Apache License 2.0 (Apache-2.0)',
						},
						{
							value: 'ubuntu font license, 1.0',
							label: 'Ubuntu Font License (UFL-1.0)',
						},
						{ value: 'mit', label: 'MIT License' },
						{ value: 'cc0-1.0', label: 'CC0-1.0 License' },
						{
							value: 'other',
							label: 'Other License',
							hint: 'Please make an issue verifying if this is usable! We are likely to reject PRs that do not match the above licenses.',
						},
					],
				}),
			licenseUrl: async () =>
				await text({
					message: colors.bold('What is the URL of the license?'),
					validate(value) {
						if (!value) return 'Please enter a URL';
						return;
					},
				}),
			licenseAttribution: async () =>
				await text({
					message: colors.bold(
						'What is the author name or attribution of the font?',
					),
					validate(value) {
						if (!value) return 'Please enter a name or attribution';
						return;
					},
				}),
			sourceUrl: async () =>
				await text({
					message: colors.bold(
						'What is the URL of the source files? GitHub repositories are preferred',
					),
					validate(value) {
						if (!value) return 'Please enter a URL';
						return;
					},
				}),
		},
		{
			onCancel: () => {
				cancel('Package creation cancelled');

				process.exit(0);
			},
		},
	);

	if (!isCategoryName(cfg.category)) {
		throw new Error(`Invalid category name: ${cfg.category}`);
	}

	const metadata: Metadata = {
		id: cfg.name.toLowerCase().replaceAll(' ', '-'),
		family: cfg.name,
		subsets: ['latin'], // cfg.subsets.split(',').map((subset) => subset.trim()),
		weights: cfg.weights
			.split(',')
			.map((weight) => Number.parseInt(weight.trim(), 10)),
		styles: cfg.styles as string[],
		defSubset: 'latin', // cfg.subsets.split(',')[0].trim(),
		variable: false,
		lastModified: new Date().toISOString().split('T')[0], // YYYY-MM-DD
		version: cfg.version,
		category: cfg.category,
		license: {
			type: licenseShort(cfg.license) ?? cfg.license,
			url: cfg.licenseUrl,
			attribution: cfg.licenseAttribution,
		},
		source: cfg.sourceUrl,
		type: 'other',
	};

	const confirmCreate = await confirm({
		message: colors.bold(
			`Create package in current directory? ./${metadata.id}`,
		),
	});

	if (typeof confirmCreate === 'boolean' && !confirmCreate) {
		cancel('Package creation cancelled.');

		process.exit(0);
	}

	try {
		await buildCustom(metadata);
	} catch (error) {
		cancel('Package creation failed.');
		consola.error(error);
		return;
	}

	outro(
		colors.green(
			`You're all set!\n\n\tNow copy all the font files into the files directory and run "fontsource create-verify" to verify your package.\n\n\tPlease ensure the file names match the format "${metadata.id}-subset-weight-style.extension"\n\tExample: "${metadata.id}-latin-400-normal.woff2" or "${metadata.id}-latin-ext-700-italic.woff"\n\n\tPlease also copy the appropriate LICENSE file from your license URL to the root directory of the package.`,
		),
	);
};
