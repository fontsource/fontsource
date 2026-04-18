import { resolvePublishedFaces } from "@fontsource-utils/core";
import type { SourceFontMetadata, VariableAxes } from "./catalog";
import { buildFontConfig } from "./font-config";

export type FontBuildMode = "copy" | "convert-woff-to-ttf";

interface FontEntry {
	filename: string;
	sourceFilename: string;
	archivePath: string;
	buildMode: FontBuildMode;
	subset: string;
	style: string;
}

export interface StaticFontEntry extends FontEntry {
	weight: number;
	extension: "woff2" | "woff" | "ttf";
}

export interface VariableFontEntry extends FontEntry {
	axisKey: string;
	extension: "woff2";
}

export interface FontPackageManifest {
	static: StaticFontEntry[];
	variable: VariableFontEntry[];
}

const buildStaticPlan = (
	metadata: SourceFontMetadata,
): StaticFontEntry[] => {
	const faces = resolvePublishedFaces(
		buildFontConfig(metadata, {
			formats: ["woff2", "woff", "ttf"],
		}),
	);

	return faces.flatMap((face) => {
		const weight = face.weight;
		if (typeof weight !== "number") {
			return [];
		}

		return face.sources.flatMap((source) => {
			if (
				source.format !== "woff2" &&
				source.format !== "woff" &&
				source.format !== "ttf"
			) {
				return [];
			}

			return {
				filename: source.publicFilename,
				sourceFilename:
					source.format === "ttf"
						? source.publicFilename.replace(/\.ttf$/, ".woff")
						: source.publicFilename,
				archivePath:
					source.format === "ttf"
						? `static/ttf/${source.filename}`
						: `static/webfonts/${source.filename}`,
				buildMode:
					source.format === "ttf" ? "convert-woff-to-ttf" : ("copy" as const),
				subset: face.subset,
				weight,
				style: face.style,
				extension: source.format,
			} satisfies StaticFontEntry;
		});
	});
};

const buildVariablePlan = (
	metadata: SourceFontMetadata,
	axes: VariableAxes,
): VariableFontEntry[] =>
	resolvePublishedFaces(
		buildFontConfig(metadata, { formats: ["woff2"], axes }),
	).flatMap((face) => {
		const axisKey = face.axisKey;

		if (!axisKey) {
			return [];
		}

		return face.sources.flatMap((source) => {
			if (source.format !== "woff2") {
				return [];
			}

			return {
				filename: source.publicFilename,
				sourceFilename: source.publicFilename,
				archivePath: `variable/webfonts/${source.filename}`,
				buildMode: "copy" as const,
				subset: face.subset,
				axisKey,
				style: face.style,
				extension: "woff2" as const,
			} satisfies VariableFontEntry;
		});
	});

export const resolveFontPackageManifest = (
	metadata: SourceFontMetadata,
	axes?: VariableAxes,
): FontPackageManifest => ({
	static: buildStaticPlan(metadata),
	variable: axes ? buildVariablePlan(metadata, axes) : [],
});
