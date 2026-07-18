import type { FontRef, StyleValue } from '@glypht/core';
import type { FontContext } from './context';

export type FontInspectionAxis = {
	tag: string;
	min: number;
	max: number;
	default: number;
};

export type FontInspection = {
	fontVersion: string | null;
	weight: number | { min: number; max: number; default: number };
	style: 'normal' | 'italic' | 'oblique';
	axes: FontInspectionAxis[];
	unicodeRanges: Array<number | readonly [number, number]>;
	tables: string[];
};

type SfntFace = {
	fontVersion: string | null;
	tables: string[];
};

// A tag is a 4-byte ASCII string, so we can read it as 4 bytes and convert to string.
const readTag = (data: DataView, offset: number): string =>
	String.fromCharCode(
		data.getUint8(offset),
		data.getUint8(offset + 1),
		data.getUint8(offset + 2),
		data.getUint8(offset + 3),
	);

// Keep this byte-level decoder instead of TextDecoder. WHATWG "latin1" is
// Windows-1252 and remaps bytes 0x80-0x9F. Its UTF-16 decoder also replaces
// malformed code units, consumes odd trailing bytes as U+FFFD, and strips a
// leading BOM. Here unsupported platform strings remain byte-preserving, while
// Unicode and Windows strings preserve raw UTF-16 code units and ignore an odd
// trailing byte.
const decodeName = (bytes: Uint8Array, platform: number): string => {
	if (platform === 0 || platform === 3) {
		const codeUnits = new Uint16Array(Math.floor(bytes.byteLength / 2));
		const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

		// Read the bytes as big-endian UTF-16 code units.
		for (let index = 0; index < codeUnits.length; index += 1) {
			codeUnits[index] = view.getUint16(index * 2);
		}

		let value = '';

		// Convert the code units to a string in chunks to avoid stack overflow for large strings.
		for (let offset = 0; offset < codeUnits.length; offset += 0x8000) {
			value += String.fromCharCode(
				...codeUnits.subarray(offset, offset + 0x8000),
			);
		}

		return value;
	}

	let value = '';
	for (let offset = 0; offset < bytes.length; offset += 0x8000) {
		value += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
	}

	return value;
};

// Prefer Windows US-English, then Unicode, then any Windows, then anything else.
const versionScore = (platform: number, language: number): number => {
	if (platform === 3 && language === 0x0409) return 0;
	if (platform === 0) return 1;
	if (platform === 3) return 2;
	return 3;
};

// Read the font version string from the 'name' table, looking for the name ID 5 (version string).
const readFontVersion = (
	buffer: Uint8Array,
	data: DataView,
	offset: number,
	length: number,
): string | null => {
	if (length < 6 || offset + length > buffer.byteLength) return null;

	const count = data.getUint16(offset + 2);
	const storageOffset = data.getUint16(offset + 4);
	const recordsOffset = offset + 6;
	const stringsOffset = offset + storageOffset;
	let bestScore = Number.POSITIVE_INFINITY;
	let bestValue: string | null = null;

	for (let index = 0; index < count; index += 1) {
		const recordOffset = recordsOffset + index * 12;
		if (recordOffset + 12 > offset + length) break;
		if (data.getUint16(recordOffset + 6) !== 5) continue;

		const platform = data.getUint16(recordOffset);
		const language = data.getUint16(recordOffset + 4);
		const stringLength = data.getUint16(recordOffset + 8);
		const stringOffset = stringsOffset + data.getUint16(recordOffset + 10);
		if (stringOffset + stringLength > offset + length) continue;

		const value = decodeName(
			buffer.subarray(stringOffset, stringOffset + stringLength),
			platform,
		)
			.replaceAll('\0', '')
			.trim();
		if (!value) continue;

		const score = versionScore(platform, language);
		if (score < bestScore) {
			bestScore = score;
			bestValue = value;
		}
	}

	return bestValue;
};

const readSfntFace = (buffer: Uint8Array): SfntFace => {
	if (buffer.byteLength < 12) throw new Error('Invalid SFNT file');

	const data = new DataView(
		buffer.buffer,
		buffer.byteOffset,
		buffer.byteLength,
	);
	if (readTag(data, 0) === 'ttcf') {
		throw new Error('Font collections are not supported');
	}

	const numTables = data.getUint16(4);
	const tables: string[] = [];
	let fontVersion: string | null = null;

	for (let index = 0; index < numTables; index += 1) {
		const recordOffset = 12 + index * 16;
		if (recordOffset + 16 > buffer.byteLength) {
			throw new Error('Invalid SFNT table directory');
		}

		const tag = readTag(data, recordOffset);
		const tableOffset = data.getUint32(recordOffset + 8);
		const tableLength = data.getUint32(recordOffset + 12);
		if (tableOffset + tableLength > buffer.byteLength) {
			throw new Error(`Invalid SFNT table range for ${tag}`);
		}
		tables.push(tag);
		if (tag === 'name') {
			fontVersion = readFontVersion(buffer, data, tableOffset, tableLength);
		}
	}

	return { fontVersion, tables: tables.sort() };
};

const axisRange = (value: {
	min: number;
	max: number;
	defaultValue: number;
}) => ({
	min: value.min,
	max: value.max,
	default: value.defaultValue,
});

const styleAxis = (
	tag: string,
	value: StyleValue,
): FontInspectionAxis | null =>
	value.type === 'variable' ? { tag, ...axisRange(value.value) } : null;

const styleValue = (value: StyleValue): number =>
	value.type === 'single' ? value.value : value.value.defaultValue;

const inspectFace = (font: FontRef, sfnt: SfntFace): FontInspection => {
	const weight = font.styleValues.weight;
	const axes = [
		styleAxis('wght', weight),
		styleAxis('wdth', font.styleValues.width),
		styleAxis('ital', font.styleValues.italic),
		styleAxis('slnt', font.styleValues.slant),
		...font.axes.map((axis) => ({ tag: axis.tag, ...axisRange(axis) })),
	]
		.filter((axis): axis is FontInspectionAxis => axis !== null)
		.sort((left, right) =>
			left.tag < right.tag ? -1 : left.tag > right.tag ? 1 : 0,
		);

	const italic = styleValue(font.styleValues.italic);
	const slant = styleValue(font.styleValues.slant);

	return {
		fontVersion: sfnt.fontVersion,
		weight: weight.type === 'single' ? weight.value : axisRange(weight.value),
		style: italic >= 0.5 ? 'italic' : slant === 0 ? 'normal' : 'oblique',
		axes,
		unicodeRanges: font.unicodeRanges,
		tables: sfnt.tables,
	};
};

/** Inspect one single-face SFNT source without retaining it in the context. */
export const inspectFont = async (
	ctx: FontContext,
	buffer: Uint8Array,
): Promise<FontInspection> => {
	const sfnt = readSfntFace(buffer);
	const fonts = await ctx.glyphtContext.loadFonts([buffer]);

	try {
		if (fonts.length !== 1 || !fonts[0]) {
			throw new Error('Expected one font face');
		}
		return inspectFace(fonts[0], sfnt);
	} finally {
		await Promise.all(fonts.map((font) => font.destroy()));
	}
};
