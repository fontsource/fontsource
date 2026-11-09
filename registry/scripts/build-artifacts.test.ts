import { createHash } from 'node:crypto';
import {
	mkdir,
	mkdtemp,
	readdir,
	readFile,
	rm,
	writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
	GetObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
	S3Client,
	S3ServiceException,
} from '@aws-sdk/client-s3';
import { expect, it, vi } from 'vitest';
import { packageMetadata } from '../../api/tests/fixtures/publication';
import {
	loadStaticFontFixture,
	loadVariableFontFixture,
} from '../../packages/core/tests/font-fixture';
import { buildArtifacts } from './build-artifacts';

it('builds verified web artifacts offline, reuses them, and rejects corrupted cached bytes', async () => {
	const directory = await mkdtemp(join(tmpdir(), 'fontsource-artifacts-'));
	const source = loadStaticFontFixture();
	const sha256 = createHash('sha256').update(source).digest('hex');
	const family = {
		...packageMetadata,
		id: 'abel',
		family: 'Abel',
		previewSource: sha256,
		sources: [
			{ ...packageMetadata.sources[0], sha256, size: source.byteLength },
		],
		distribution: {
			static: [{ weight: 400, style: 'normal', source: sha256 }],
			characters: {
				type: 'subsets',
				defaultSubset: 'latin',
				subsets: [{ id: 'latin', definition: 'latin' }],
			},
		},
	};
	const inputs = join(directory, 'inputs');
	const out = join(directory, 'out');
	try {
		await mkdir(join(inputs, 'abel/sources'), { recursive: true });
		await writeFile(join(inputs, 'abel/sources', sha256), source);
		await writeFile(
			join(inputs, 'abel/snapshot.json'),
			JSON.stringify({
				revision: 'a'.repeat(40),
				families: [family],
				subsets: { latin: { id: 'latin', ranges: [['41', '42']] } },
			}),
		);
		const [first] = await buildArtifacts(['abel'], { inputs, out });
		expect(first.files.some((file) => file.path.endsWith('.woff2'))).toBe(true);
		expect(first.manifest.faces).toMatchObject([
			{ weight: 400, style: 'normal', unicodeRange: 'U+41-42' },
		]);
		const prefix = join(out, `prepared/abel/static/${first.artifact}`);
		for (const file of first.files) {
			const bytes = await readFile(join(prefix, file.path));
			expect(bytes.byteLength).toBe(file.size);
			expect(createHash('sha256').update(bytes).digest('hex')).toBe(
				file.sha256,
			);
		}
		expect(await buildArtifacts(['abel'], { inputs, out })).toEqual([first]);
		expect(
			await buildArtifacts(['abel'], {
				inputs,
				out: join(directory, 'rebuild'),
			}),
		).toEqual([first]);
		vi.stubEnv('R2_S3_ENDPOINT', 'https://r2.test');
		vi.stubEnv('R2_ACCESS_KEY_ID', 'test');
		vi.stubEnv('R2_SECRET_ACCESS_KEY', 'test');
		const uploaded: string[] = [];
		let interrupted = true;
		const send = vi
			.spyOn(S3Client.prototype, 'send')
			.mockImplementation(async (command: unknown) => {
				if (
					command instanceof HeadObjectCommand ||
					command instanceof GetObjectCommand
				)
					throw new S3ServiceException({
						name: 'NotFound',
						$fault: 'client',
						$metadata: { httpStatusCode: 404 },
					});
				if (!(command instanceof PutObjectCommand))
					throw new Error('Unexpected storage operation');
				const key = command.input.Key ?? '';
				if (interrupted && key.endsWith('.woff2'))
					throw new Error('Upload interrupted');
				uploaded.push(key);
				return {};
			});
		await expect(
			buildArtifacts(['abel'], { inputs, out, upload: true }),
		).rejects.toThrow('Upload interrupted');
		expect(uploaded.some((key) => key.endsWith('.json'))).toBe(false);
		interrupted = false;
		await buildArtifacts(['abel'], { inputs, out, upload: true });
		expect(uploaded.slice(-2)).toEqual([
			`prepared/abel/static/${first.artifact}/manifest.json`,
			'prepared/abel/static/current.json',
		]);
		// A fresh CI runner reuses remote files through metadata checks, without
		// downloading binaries or rebuilding them into its output directory.
		send.mockImplementation(async (command: unknown) => {
			if (
				command instanceof GetObjectCommand &&
				command.input.Key?.endsWith('/manifest.json')
			)
				return {
					Body: {
						transformToByteArray: async () =>
							Buffer.from(JSON.stringify(first)),
					},
				};
			if (command instanceof HeadObjectCommand) {
				const file = first.files.find((file) =>
					command.input.Key?.endsWith(`/${file.path}`),
				);
				if (file)
					return {
						ContentLength: file.size,
						Metadata: { sha256: file.sha256 },
					};
			}
			if (
				command instanceof PutObjectCommand &&
				command.input.Key?.endsWith('/current.json')
			)
				return {};
			throw new Error(
				'Remote reuse attempted a binary download, upload, or rebuild',
			);
		});
		const reusedOut = join(directory, 'remote-reuse');
		expect(
			await buildArtifacts(['abel'], { inputs, out: reusedOut, upload: true }),
		).toEqual([first]);
		await expect(readdir(reusedOut)).rejects.toMatchObject({ code: 'ENOENT' });
		await writeFile(join(prefix, first.files[0].path), 'corrupt');
		await expect(buildArtifacts(['abel'], { inputs, out })).rejects.toThrow(
			'artifact integrity mismatch',
		);
	} finally {
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
		await rm(directory, { recursive: true, force: true });
	}
});

it('pins both package kinds to one identity and retains discovery if the second kind fails', async () => {
	const directory = await mkdtemp(
		join(tmpdir(), 'fontsource-family-artifacts-'),
	);
	const source = loadVariableFontFixture();
	const sha256 = createHash('sha256').update(source).digest('hex');
	const family = {
		...packageMetadata,
		id: 'recursive',
		family: 'Recursive',
		previewSource: sha256,
		sources: [
			{
				...packageMetadata.sources[0],
				sha256,
				size: source.byteLength,
				type: 'variable',
				weight: { min: 300, max: 1000, default: 300 },
				axes: [{ tag: 'wght', min: 300, max: 1000, default: 300 }],
			},
		],
		distribution: {
			static: [{ weight: 400, style: 'normal', source: sha256 }],
			variable: [{ axisKey: 'wght', style: 'normal', source: sha256 }],
			characters: {
				type: 'subsets',
				defaultSubset: 'latin',
				subsets: [{ id: 'latin', definition: 'latin' }],
			},
		},
	};
	const inputs = join(directory, 'inputs');
	const out = join(directory, 'out');
	const snapshot = () =>
		JSON.stringify({
			revision: 'a'.repeat(40),
			families: [family],
			subsets: { latin: { id: 'latin', ranges: [['41', '42']] } },
		});
	try {
		await mkdir(join(inputs, 'recursive/sources'), { recursive: true });
		await writeFile(join(inputs, 'recursive/sources', sha256), source);
		await writeFile(join(inputs, 'recursive/snapshot.json'), snapshot());
		const first = await buildArtifacts(['recursive'], { inputs, out });
		expect(first.map((item) => item.kind)).toEqual(['static', 'variable']);
		expect(first[0].artifact).toBe(first[1].artifact);
		family.sources[0].axes[0].max = 2000;
		await writeFile(join(inputs, 'recursive/snapshot.json'), snapshot());
		await expect(
			buildArtifacts(['recursive'], { inputs, out }),
		).rejects.toThrow();
		for (const kind of ['static', 'variable'])
			expect(
				JSON.parse(
					await readFile(
						join(out, `prepared/recursive/${kind}/current.json`),
						'utf8',
					),
				),
			).toBe(first[0].artifact);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
});
