import { NodeResolvePlugin } from '@esbuild-plugins/node-resolve';
import type { ModuleInfo } from '@fal-works/esbuild-plugin-global-externals';
import { globalExternals } from '@fal-works/esbuild-plugin-global-externals';
import type { BuildOptions, Loader, Plugin } from 'esbuild';
import * as esbuild from 'esbuild';
import { nanoid } from 'nanoid';
import path from 'pathe';
import { StringDecoder } from 'string_decoder';
import type { VFileCompatible } from 'vfile';
import { VFile } from 'vfile';
import { matter } from 'vfile-matter';

/**
 * Mostly derived from MDX Bundler, but strips out a lot of the stuff we don't need as
 * well as fix some incomparabilities with esbuild resolution with pnpm and esm plugins.
 */

interface SerialiseOutput {
	code: string;
	frontmatter: Record<string, unknown>;
}

const esbuildOptions = async (source: VFile): Promise<BuildOptions> => {
	const absoluteFiles: Record<string, string> = {};

	const entryPath = source.path
		? path.isAbsolute(source.path)
			? source.path
			: path.join(source.cwd, source.path)
		: path.join(source.cwd, `./_mdx_bundler_entry_point-${nanoid()}.mdx`);
	absoluteFiles[entryPath] = String(source.value);

	// https://github.com/kentcdodds/mdx-bundler/pull/206
	const define: BuildOptions['define'] = {};
	if (process.env.NODE_ENV !== undefined) {
		define['process.env.NODE_ENV'] = JSON.stringify(process.env.NODE_ENV);
	}

	const inMemoryPlugin: Plugin = {
		name: 'inMemory',
		setup(build) {
			build.onResolve({ filter: /.*/ }, ({ path: filePath, importer }) => {
				if (filePath === entryPath) {
					return {
						path: filePath,
						pluginData: { inMemory: true, contents: absoluteFiles[filePath] },
					};
				}

				const modulePath = path.resolve(path.dirname(importer), filePath);

				if (modulePath in absoluteFiles) {
					return {
						path: modulePath,
						pluginData: {
							inMemory: true,
							contents: absoluteFiles[modulePath],
						},
					};
				}

				for (const ext of ['.js', '.ts', '.jsx', '.tsx', '.json', '.mdx']) {
					const fullModulePath = `${modulePath}${ext}`;
					if (fullModulePath in absoluteFiles) {
						return {
							path: fullModulePath,
							pluginData: {
								inMemory: true,
								contents: absoluteFiles[fullModulePath],
							},
						};
					}
				}

				// Return an empty object so that esbuild will handle resolving the file itself.
				return {};
			});

			build.onLoad({ filter: /.*/ }, async ({ path: filePath, pluginData }) => {
				if (pluginData === undefined || !pluginData.inMemory) {
					// Return an empty object so that esbuild will load & parse the file contents itself.
					return null;
				}

				// the || .js allows people to exclude a file extension
				const fileType = (path.extname(filePath) || '.jsx').slice(1);
				const contents = absoluteFiles[filePath];

				if (fileType === 'mdx') return null;

				let loader: Loader;

				if (
					build.initialOptions.loader &&
					build.initialOptions.loader[`.${fileType}`]
				) {
					loader = build.initialOptions.loader[`.${fileType}`];
				} else {
					loader = fileType as Loader;
				}

				return {
					contents,
					loader,
				};
			});
		},
	};

	// Import ESM into CJS
	const mdxPlugin = (await import('@mdx-js/esbuild')).default;

	// This helps reduce bundles from having duplicated packages
	const globals: Record<string, ModuleInfo> = {
		react: {
			varName: 'React',
			type: 'cjs',
		},
		'react-dom': {
			varName: 'ReactDOM',
			type: 'cjs',
		},
	};

	// JSX global runtime
	const devRuntime = {
		'react/jsx-dev-runtime': {
			varName: '_jsx_runtime',
			type: 'cjs',
		},
	};
	const prodRuntime = {
		'react/jsx-runtime': {
			varName: '_jsx_runtime',
			type: 'cjs',
		},
	};
	process.env.NODE_ENV === 'production'
		? Object.assign(globals, prodRuntime)
		: Object.assign(globals, devRuntime);

	return {
		entryPoints: [entryPath],
		write: false,
		define,
		plugins: [
			globalExternals(globals),
			NodeResolvePlugin({
				extensions: ['.js', '.jsx', '.ts', '.tsx'],
			}),
			inMemoryPlugin,
			mdxPlugin({}),
		],
		bundle: true,
		format: 'iife',
		globalName: 'Component',
		minify: process.env.NODE_ENV === 'production',
	};
};

const serialise = async (source: VFileCompatible): Promise<SerialiseOutput> => {
	const file = new VFile(source);
	matter(file, { strip: true });

	const bundled = await esbuild.build(await esbuildOptions(file));
	const decoder = new StringDecoder('utf8');

	if (bundled.outputFiles === undefined || bundled.outputFiles.length === 0) {
		throw new Error('Esbuild bundling error');
	}

	const code = decoder.write(Buffer.from(bundled.outputFiles[0].contents));

	return {
		code: `${code};return Component`,
		frontmatter: file.data.matter as Record<string, unknown>,
	};
};

export { serialise };
