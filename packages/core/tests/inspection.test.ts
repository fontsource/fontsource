import { afterAll, describe, expect, it } from 'vitest';
import { createFontContext, inspectFont } from '../src';
import { loadStaticFontFixture, loadVariableFontFixture } from './font-fixture';

const ctx = createFontContext();

afterAll(() => ctx.destroy());

const addSfntTable = (
	source: Uint8Array,
	tag: string,
	table: Uint8Array,
): Uint8Array => {
	const sourceView = new DataView(
		source.buffer,
		source.byteOffset,
		source.byteLength,
	);
	const tableCount = sourceView.getUint16(4);
	const directoryEnd = 12 + tableCount * 16;
	const paddedLength = (table.byteLength + 3) & ~3;
	const output = new Uint8Array(source.byteLength + 16 + paddedLength);
	const outputView = new DataView(output.buffer);
	output.set(source.subarray(0, directoryEnd), 0);
	output.set(source.subarray(directoryEnd), directoryEnd + 16);

	for (let index = 0; index < tableCount; index += 1) {
		const recordOffset = 12 + index * 16;
		outputView.setUint32(
			recordOffset + 8,
			sourceView.getUint32(recordOffset + 8) + 16,
		);
	}

	const recordOffset = directoryEnd;
	for (let index = 0; index < 4; index += 1) {
		outputView.setUint8(recordOffset + index, tag.charCodeAt(index));
	}
	outputView.setUint32(recordOffset + 8, source.byteLength + 16);
	outputView.setUint32(recordOffset + 12, table.byteLength);
	output.set(table, source.byteLength + 16);

	const nextCount = tableCount + 1;
	const entrySelector = Math.floor(Math.log2(nextCount));
	const searchRange = 2 ** entrySelector * 16;
	outputView.setUint16(4, nextCount);
	outputView.setUint16(6, searchRange);
	outputView.setUint16(8, entrySelector);
	outputView.setUint16(10, nextCount * 16 - searchRange);
	return output;
};

describe('inspectFont', () => {
	it('reads static source facts', async () => {
		const result = await inspectFont(ctx, loadStaticFontFixture());

		expect(result).toMatchObject({
			fontVersion: expect.stringContaining('Version'),
			weight: 400,
			style: 'normal',
			axes: [],
		});
		expect(result.tables).toContain('glyf');
		expect(result.unicodeRanges.length).toBeGreaterThan(0);
	});

	it('keeps variable style and custom axes explicit', async () => {
		const face = await inspectFont(ctx, loadVariableFontFixture());

		expect(face.weight).toEqual({ min: 300, max: 1000, default: 300 });
		expect(face.axes.map((axis) => axis.tag)).toEqual([
			'CASL',
			'CRSV',
			'MONO',
			'slnt',
			'wght',
		]);
	});

	it('reports tables that require specialized build support', async () => {
		const colorHeader = new Uint8Array(14);
		const result = await inspectFont(
			ctx,
			addSfntTable(loadStaticFontFixture(), 'COLR', colorHeader),
		);

		expect(result.tables).toContain('COLR');
	});
});
