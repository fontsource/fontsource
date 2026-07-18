import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { openGitTree } from './git.ts';
import {
	type FamilyPolicy,
	familyInspectionSchema,
	familyMetadataSchema,
	familyPolicySchema,
	registryIndexSchema,
} from './schema.ts';
import { compareStrings, isMain, readJson, writeJson } from './shared.ts';
import { validatePolicyResolution, validateRegistry } from './validator.ts';

const catalogSchema = z.record(
	z.string(),
	z.object({
		subsets: z.array(z.string()),
		defSubset: z.string(),
	}),
);

type StaticVariant = NonNullable<
	FamilyPolicy['packages']['static']
>['variants'][number];
type VariableVariant = NonNullable<
	FamilyPolicy['packages']['variable']
>['variants'][number];

type FamilyVariants = {
	static: Map<string, StaticVariant>;
	variable: Map<string, VariableVariant>;
};

const collectVariants = (
	paths: readonly string[],
): Map<string, FamilyVariants> => {
	const families = new Map<string, FamilyVariants>();
	const variantsFor = (familyId: string): FamilyVariants => {
		const existing = families.get(familyId);
		if (existing) return existing;
		const variants: FamilyVariants = {
			static: new Map(),
			variable: new Map(),
		};
		families.set(familyId, variants);
		return variants;
	};

	for (const path of paths) {
		const match = path.match(
			/^fonts\/(google|icons|other|variable|variable-icons)\/([^/]+)\/([^/]+)\.css$/,
		);
		if (!match?.[1] || !match[2] || !match[3] || match[3] === 'index') continue;
		const [, group, familyId, filename] = match;

		if (group === 'google' || group === 'icons' || group === 'other') {
			const variant = filename.match(/(?:^|-)(\d+)(-italic)?$/);
			if (!variant?.[1]) continue;
			const value: StaticVariant = {
				weight: Number(variant[1]),
				style: variant[2] ? 'italic' : 'normal',
			};
			variantsFor(familyId).static.set(`${value.weight}:${value.style}`, value);
			continue;
		}

		const style = filename.endsWith('-italic') ? 'italic' : 'normal';
		const stem = style === 'italic' ? filename.slice(0, -8) : filename;
		const axisKey = stem.split('-').at(-1)?.toLowerCase();
		if (!axisKey || !/^(?:standard|full|[a-z0-9]{4})$/.test(axisKey)) continue;
		const value: VariableVariant = { axisKey, style };
		variantsFor(familyId).variable.set(
			`${value.axisKey}:${value.style}`,
			value,
		);
	}

	return families;
};

const resolveSubsetDefinition = (
	id: string,
	available: ReadonlySet<string>,
): string => {
	const web = `${id}-web`;
	return available.has(web) ? web : id;
};

/** Seed policy once from the currently shipped package inventory. */
export const bootstrapPolicy = async (
	repository: string,
	revision: string,
	root: string,
): Promise<void> => {
	const snapshot = openGitTree(repository, revision);
	const index = registryIndexSchema.parse(
		await readJson(join(root, 'index.json')),
	);
	const catalog = catalogSchema.parse(
		JSON.parse(snapshot.read('metadata/fontsource.json').toString('utf8')),
	);
	const variants = collectVariants(snapshot.paths);
	const availableSubsets = new Set(index.subsets);

	for (const familyId of index.families) {
		const policyPath = join(root, 'families', familyId, 'policy.json');
		const catalogEntry = catalog[familyId];
		const familyVariants = variants.get(familyId);
		const staticVariants = Array.from(
			familyVariants?.static.values() ?? [],
		).toSorted(
			(left, right) =>
				left.weight - right.weight || compareStrings(left.style, right.style),
		);
		const variableVariants = Array.from(
			familyVariants?.variable.values() ?? [],
		).toSorted(
			(left, right) =>
				compareStrings(left.axisKey, right.axisKey) ||
				compareStrings(left.style, right.style),
		);
		if (
			!catalogEntry ||
			(staticVariants.length === 0 && variableVariants.length === 0)
		) {
			await rm(policyPath, { force: true });
			continue;
		}

		const policySubsets = Array.from(new Set(catalogEntry.subsets))
			.filter((id) => id !== 'menu')
			.map((id) => ({
				id,
				definition: resolveSubsetDefinition(id, availableSubsets),
			}));
		const unresolvedSubset = policySubsets.find(
			(subset) => !availableSubsets.has(subset.definition),
		);
		if (unresolvedSubset) {
			await rm(policyPath, { force: true });
			console.warn(
				`${familyId}: no policy because subset ${unresolvedSubset.definition} has no registry definition`,
			);
			continue;
		}
		const defaultSubset = catalogEntry.defSubset;
		if (!policySubsets.some((subset) => subset.id === defaultSubset)) {
			throw new Error(
				`${familyId} has unmapped default subset ${defaultSubset}`,
			);
		}

		const policy = familyPolicySchema.parse({
			packages: {
				...(staticVariants.length > 0
					? { static: { variants: staticVariants } }
					: {}),
				...(variableVariants.length > 0
					? { variable: { variants: variableVariants } }
					: {}),
			},
			defaultSubset,
			subsets: policySubsets,
		});
		try {
			validatePolicyResolution(
				policy,
				familyMetadataSchema.parse(
					await readJson(join(root, 'families', familyId, 'metadata.json')),
				),
				familyInspectionSchema.parse(
					await readJson(join(root, 'families', familyId, 'inspection.json')),
				),
				familyId,
			);
		} catch (error) {
			await rm(policyPath, { force: true });
			console.warn(
				`${familyId}: no policy because ${error instanceof Error ? error.message : String(error)}`,
			);
			continue;
		}
		await writeJson(policyPath, policy);
	}

	await validateRegistry(root);
};

if (isMain(import.meta.url)) {
	const [repository, revision, registryRoot] = process.argv.slice(2);
	if (!repository || !revision || !registryRoot || process.argv.length !== 5) {
		throw new Error(
			'Usage: bootstrap-policy.ts <font-files-repo> <commit> <registry-dir>',
		);
	}
	await bootstrapPolicy(repository, revision, registryRoot);
}
