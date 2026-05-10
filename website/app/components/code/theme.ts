const settings = [
	{
		scope: [
			'comment',
			'block.comment',
			'punctuation.definition.comment',
			'string.comment',
		],
		settings: { foreground: '#68768d' },
	},
	{
		scope: [
			'punctuation',
			'meta.brace',
			'meta.delimiter',
			'punctuation.definition.tag',
		],
		settings: { foreground: '#68768d' },
	},
	{
		scope: [
			'keyword',
			'storage',
			'storage.type',
			'storage.modifier',
			'support.type.property-name.css',
			'entity.other.attribute-name',
		],
		settings: { foreground: '#625bf8' },
	},
	{
		scope: ['string', 'punctuation.definition.string', 'string.quoted'],
		settings: { foreground: '#eff5fe' },
	},
	{
		scope: ['constant.numeric', 'constant.language', 'constant.character'],
		settings: { foreground: '#dad5ff' },
	},
	{
		scope: [
			'entity.name.function',
			'support.function',
			'variable.function',
			'meta.function-call',
		],
		settings: { foreground: '#f2c259' },
	},
	{
		scope: [
			'entity.name.tag',
			'entity.name.type',
			'entity.name.class',
			'entity.name.namespace',
		],
		settings: { foreground: '#d1d1d1' },
	},
	{
		scope: [
			'variable',
			'variable.other',
			'support.variable',
			'meta.property-name',
			'support.type.vendored.property-name',
		],
		settings: { foreground: '#ffffff' },
	},
	{
		scope: ['keyword.operator', 'constant.other.color', 'entity.other'],
		settings: { foreground: '#bbe9dc' },
	},
	{
		scope: ['markup.inserted', 'punctuation.definition.inserted'],
		settings: { foreground: '#a3a3a3' },
	},
];

export const fontsourceCodeTheme = {
	name: 'fontsource',
	displayName: 'Fontsource',
	type: 'dark' as const,
	fg: '#c2bfff',
	bg: '#01112c',
	colors: {
		'editor.background': '#01112c',
		'editor.foreground': '#c2bfff',
		'editorLineNumber.foreground': '#68768d',
		'editor.selectionBackground': '#625bf84d',
	},
	settings,
	tokenColors: settings,
};
