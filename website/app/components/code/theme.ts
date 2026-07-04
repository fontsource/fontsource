const palette = {
	background: '#01112c',
	foreground: '#c2bfff',
	comment: '#68768d',
	punctuation: '#7c86a3',
	purple: '#8b83ff',
	purpleSoft: '#b8b4ff',
	lavender: '#dad5ff',
	white: '#eff5fe',
};

const settings = [
	{
		scope: [
			'comment',
			'block.comment',
			'punctuation.definition.comment',
			'string.comment',
		],
		settings: { foreground: palette.comment },
	},
	{
		scope: [
			'punctuation',
			'meta.brace',
			'meta.delimiter',
			'punctuation.definition.tag',
		],
		settings: { foreground: palette.punctuation },
	},
	{
		scope: [
			'keyword',
			'storage',
			'storage.type',
			'storage.modifier',
			'support.type.property-name.css',
			'entity.other.attribute-name',
			'entity.other.attribute-name.jsx',
			'entity.other.attribute-name.tsx',
		],
		settings: { foreground: palette.purple },
	},
	{
		scope: ['string', 'punctuation.definition.string', 'string.quoted'],
		settings: { foreground: palette.white },
	},
	{
		scope: ['constant.numeric', 'constant.language', 'constant.character'],
		settings: { foreground: palette.purpleSoft },
	},
	{
		scope: [
			'entity.name.function',
			'support.function',
			'support.function.builtin',
			'support.function.builtin.shell',
			'variable.function',
			'meta.function-call',
		],
		settings: { foreground: palette.lavender },
	},
	{
		scope: [
			'entity.name.tag',
			'entity.name.tag.jsx',
			'entity.name.tag.tsx',
			'entity.name.type',
			'entity.name.class',
			'entity.name.namespace',
		],
		settings: { foreground: palette.white },
	},
	{
		scope: [
			'variable',
			'variable.other',
			'support.variable',
			'meta.property-name',
			'support.type.vendored.property-name',
		],
		settings: { foreground: palette.foreground },
	},
	{
		scope: ['keyword.operator', 'constant.other.color', 'entity.other'],
		settings: { foreground: palette.punctuation },
	},
	{
		scope: ['markup.inserted', 'punctuation.definition.inserted'],
		settings: { foreground: palette.purpleSoft },
	},
	{
		scope: ['markup.deleted', 'punctuation.definition.deleted'],
		settings: { foreground: palette.purpleSoft },
	},
	{
		scope: [
			'meta.object-literal.key',
			'variable.other.property',
			'support.type.property-name',
			'support.type.property-name.json',
			'support.type.property-name.css',
		],
		settings: { foreground: palette.foreground },
	},
	{
		scope: [
			'string.unquoted',
			'string.unquoted.shell',
			'variable.other.normal.shell',
			'variable.other.bracket.shell',
			'support.variable',
		],
		settings: { foreground: palette.purpleSoft },
	},
	{
		scope: [
			'string.unquoted.css',
			'support.constant.property-value.css',
			'support.constant.font-name.css',
		],
		settings: { foreground: palette.white },
	},
	{
		scope: [
			'support.function.builtin.shell',
			'entity.name.command.shell',
			'meta.function-call.shell',
		],
		settings: { foreground: palette.foreground },
	},
	{
		scope: [
			'keyword.control.at-rule.css',
			'keyword.control.at-rule.scss',
			'keyword.control.directive.scss',
		],
		settings: { foreground: palette.purple },
	},
	{
		scope: ['variable.other.scss', 'variable.scss', 'variable.parameter.scss'],
		settings: { foreground: palette.purpleSoft },
	},
];

export const fontsourceCodeTheme = {
	name: 'fontsource',
	displayName: 'Fontsource',
	type: 'dark' as const,
	fg: palette.foreground,
	bg: palette.background,
	colors: {
		'editor.background': palette.background,
		'editor.foreground': palette.foreground,
		'editorLineNumber.foreground': palette.comment,
		'editor.selectionBackground': '#625bf84d',
	},
	settings,
	tokenColors: settings,
};
