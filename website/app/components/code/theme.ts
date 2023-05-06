import type { themes } from 'prism-react-renderer';

type PrismTheme = typeof themes.dracula; // Any theme would do, they don't export the type.

export const theme: PrismTheme = {
	plain: {
		color: '#C2BFFF',
		backgroundColor: '#01112C',
	},
	styles: [
		{
			types: ['comment', 'block-comment', 'prolog', 'doctype', 'cdata'],
			style: {
				color: '#68768D',
			},
		},
		{
			types: ['punctuation'],
			style: {
				color: '#68768D',
			},
		},
		{
			types: ['tag', 'attr-name', 'namespace', 'deleted'],
			style: {
				color: '#D1D1D1',
			},
		},
		{
			types: ['function-name'],
			style: {
				color: '#F2C259',
			},
		},
		{
			types: ['boolean', 'number', 'function'],
			style: {
				color: '#DAD5FF',
			},
		},
		{
			types: ['property', 'class-name', 'constant', 'symbol'],
			style: {
				color: '#FFFFFF',
			},
		},
		{
			types: ['selector', 'important', 'atrule', 'keyword', 'builtin'],
			style: {
				color: '#625BF8',
			},
		},
		{
			types: ['string', 'char', 'attr-value', 'regex', 'variable'],
			style: {
				color: '#EFF5FE',
			},
		},
		{
			types: ['operator', 'entity', 'url'],
			style: {
				color: '#BBE9DC',
			},
		},
		{
			types: ['inserted'],
			style: {
				color: '#A3A3A3',
			},
		},
	],
};

export default theme;
