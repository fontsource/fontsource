import { describe, expect, it } from 'vitest';
import { parseGoogleFamily } from './google.ts';

const ABEL_METADATA = `
name: "Abel"
designer: "MADType"
license: "OFL"
category: "SANS_SERIF"
date_added: "2011-08-03"
fonts {
  name: "Abel"
  style: "normal"
  weight: 400
  filename: "Abel-Regular.ttf"
  post_script_name: "Abel-Regular"
  full_name: "Abel Regular"
  position {
    tag: "wght"
    position: 400.0
  }
}
subsets: "latin"
source {
  repository_url: "https://github.com/librefonts/abel"
  commit: "abc123"
}
`;

describe('Google provider schema', () => {
	it('accepts current Google metadata and the documented position exception', () => {
		expect(parseGoogleFamily(ABEL_METADATA)).toMatchObject({
			name: 'Abel',
			fonts: [{ filename: 'Abel-Regular.ttf' }],
			project: {
				repository: 'https://github.com/librefonts/abel',
				revision: 'abc123',
			},
		});
	});

	it('fails when the pinned provider contract gains an unknown field', () => {
		expect(() =>
			parseGoogleFamily(`${ABEL_METADATA}\nnew_field: true`),
		).toThrow(/unknown field 'new_field'/);
	});

	it('fails when required provider metadata is missing', () => {
		expect(() =>
			parseGoogleFamily(ABEL_METADATA.replace('name: "Abel"\n', '')),
		).toThrow(/missing required field/);
	});

	it('does not silently accept an upstream-reserved field', () => {
		expect(() =>
			parseGoogleFamily(`${ABEL_METADATA}
axes {
  tag: "wght"
  min_value: 100
  default_value: 400
  max_value: 900
}`),
		).toThrow(/unknown field 'default_value'/);
	});
});
