import { createHash } from 'node:crypto';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, expect, it } from 'vitest';
import {
	PreparedArtifactSchema,
	preparedArtifactUrl,
} from '../../../../api/shared/prepared-artifacts';
import {
	packageManifest,
	packageMetadata,
} from '../../../../api/tests/fixtures/publication';
import { downloadPackages } from '../../src/registry/download';

const bytes = Buffer.from('verified web-font bytes');
const artifactId = 'a'.repeat(64);
const assets = new Map([
	['index.css', Buffer.from('@font-face {font-family: "New Math";}')],
	['400.css', Buffer.from('@font-face {font-family: "New Math";}')],
	['files/new-math-full-400-normal.woff2', bytes],
]);
const artifact = PreparedArtifactSchema.parse({
	schemaVersion: 1,
	id: 'new-math',
	kind: 'static',
	artifact: artifactId,
	profile: 'test',
	metadata: packageMetadata,
	manifest: packageManifest,
	files: [...assets].map(([path, content]) => ({
		path,
		sha256: createHash('sha256').update(content).digest('hex'),
		size: content.length,
		url: `${preparedArtifactUrl('new-math', 'static', artifactId)}/${path}`,
	})),
});
let corrupt = false;
let incomplete = false;
let mixed = false;
let requestedArtifact: string | null = null;
let origin = '';
const server = createServer((request, response) => {
	const requestUrl = new URL(request.url ?? '/', 'http://localhost');
	if (
		requestUrl.pathname === '/v1/registry/families/new-math/artifacts/variable'
	) {
		requestedArtifact = requestUrl.searchParams.get('artifact');
		if (mixed) {
			const different = 'b'.repeat(64);
			response.setHeader('Content-Type', 'application/json');
			response.end(
				JSON.stringify({
					...artifact,
					kind: 'variable',
					artifact: different,
					metadata: {
						...artifact.metadata,
						distribution: {
							...artifact.metadata.distribution,
							variable: [
								{ source: '2'.repeat(64), style: 'normal', axisKey: 'wght' },
							],
						},
					},
					manifest: {
						...artifact.manifest,
						faces: artifact.manifest.faces.map((face) => ({
							...face,
							isVariable: true,
						})),
					},
					files: artifact.files.map((file) => ({
						...file,
						url: `${preparedArtifactUrl('new-math', 'variable', different)}/${file.path}`,
					})),
				}),
			);
			return;
		}
	}
	if (request.url === '/v1/registry/families/new-math/artifacts/static') {
		response.setHeader('Content-Type', 'application/json');
		response.end(
			JSON.stringify(
				incomplete
					? {
							...artifact,
							metadata: {
								...artifact.metadata,
								distribution: {
									...artifact.metadata.distribution,
									variable: [
										{
											source: '2'.repeat(64),
											style: 'normal',
											axisKey: 'wght',
										},
									],
								},
							},
						}
					: artifact,
			),
		);
		return;
	}
	const file = artifact.files.find((file) => file.url === request.url);
	if (!file) {
		response.statusCode = 404;
		response.end();
		return;
	}
	response.end(corrupt ? Buffer.from('corrupt') : assets.get(file.path));
});
beforeAll(async () => {
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	const address = server.address();
	if (!address || typeof address === 'string')
		throw new Error('Missing server address');
	origin = `http://127.0.0.1:${address.port}`;
});
afterAll(async () => {
	server.closeAllConnections();
	await new Promise<void>((resolve, reject) =>
		server.close((error) => (error ? reject(error) : resolve())),
	);
});

it('assembles exact API bytes and v6 package files over HTTP', async () => {
	const directory = await mkdtemp(join(tmpdir(), 'fontsource-download-test-'));
	try {
		const out = join(directory, 'packages');
		await downloadPackages(['new-math'], { out, registryUrl: origin });
		const pkg = join(out, 'static', 'new-math');
		expect(requestedArtifact).toBe(artifactId);
		expect(
			await readFile(join(pkg, 'files/new-math-full-400-normal.woff2')),
		).toEqual(bytes);
		expect(
			JSON.parse(await readFile(join(pkg, 'manifest.json'), 'utf8')),
		).toEqual(packageManifest);
		const files = await readdir(pkg, { recursive: true });
		expect(files).toContain('scss/metadata.scss');
		expect(files).toContain('CHANGELOG.md');
		expect(files).not.toContain('unicode.json');
		expect(files).not.toContain('scss/mixins.scss');
		await expect(
			downloadPackages(['new-math'], { out, registryUrl: origin }),
		).rejects.toThrow('already exists');
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
});

it.each(['corrupt', 'incomplete', 'mixed'])(
	'does not leave a partial package for %s assets',
	async (failure) => {
		const directory = await mkdtemp(
			join(tmpdir(), 'fontsource-download-test-'),
		);
		corrupt = failure === 'corrupt';
		incomplete = failure === 'incomplete';
		mixed = failure === 'mixed';
		try {
			await expect(
				downloadPackages(['new-math'], {
					out: join(directory, 'packages'),
					registryUrl: origin,
				}),
			).rejects.toThrow();
			expect(await readdir(directory)).toEqual([]);
		} finally {
			corrupt = false;
			incomplete = false;
			mixed = false;
			await rm(directory, { recursive: true, force: true });
		}
	},
);
