import {
	buildFont,
	type FontBuildCharacters,
	type FontBuildTarget,
	type FontContext,
} from '@fontsource-utils/core';
import type { RegistryFamilyDetail } from '../../../api/shared/registry';
import type { BuildInputs } from './registry';

const expandRanges = (ranges: [string, string][]): number[] =>
	ranges.flatMap(([start, end]) => {
		const first = Number.parseInt(start, 16);
		return Array.from(
			{ length: Number.parseInt(end, 16) - first + 1 },
			(_, index) => first + index,
		);
	});

export async function buildFamily(
	context: FontContext,
	family: RegistryFamilyDetail,
	inputs: BuildInputs,
	variable: boolean,
) {
	const distribution = family.distribution;
	const sourceBytes = (hash: string) => {
		const bytes = inputs.sources.get(hash);
		if (!bytes) throw new Error(`${family.id}: missing source ${hash}`);
		return bytes;
	};
	let characters: FontBuildCharacters = 'all';
	if (distribution.characters.type === 'subsets') {
		const selection = distribution.characters;
		characters = selection.subsets.map(({ id, definition }) => ({
			subset: id,
			codepoints: expandRanges(inputs.subsets[definition].ranges),
		}));
		if (selection.slicing) {
			const slices = inputs.subsets[selection.slicing].slices;
			const subset = selection.slicingSubset;
			if (!slices?.length || !subset)
				throw new Error(`${family.id}: incomplete slicing definition`);
			characters.push(
				...slices.map((slice) => ({
					subset,
					sliceIndex: Number(slice.id),
					codepoints: expandRanges(slice.ranges),
				})),
			);
		}
	}
	const targets: FontBuildTarget[] = variable
		? (distribution.variable ?? []).map((target) => {
				const source = family.sources.find(
					(source) => source.sha256 === target.source,
				);
				if (source?.type !== 'variable')
					throw new Error(
						`${family.id}: variable target requires a variable source`,
					);
				return {
					type: 'variable',
					source: sourceBytes(target.source),
					style: target.style,
					axisKey: target.axisKey,
					// Registry outputs declare separate styles; do not retain the source's ital range.
					axes: Object.fromEntries(
						source.axes
							.filter((axis) => axis.tag !== 'ital')
							.map(({ tag, ...range }) => [tag, range]),
					),
				};
			})
		: (distribution.static ?? []).map((target) => ({
				type: 'static',
				source: sourceBytes(target.source),
				weight: target.weight,
				style: target.style,
			}));
	return buildFont(context, {
		id: family.id,
		family: family.family,
		targets,
		characters,
		formats: ['woff2'],
	});
}
