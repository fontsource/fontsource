import { themes } from 'prism-react-renderer';

type PrismTheme = typeof themes.dracula; // Any theme would do, they don't export the type.

export const theme: PrismTheme = {
	...themes.nightOwl,
	plain: {
		color: '#C2BFFF',
		backgroundColor: '#01112C',
	},
	/* styles: [
		{
			types: ['inserted', 'attr-name'],
			style: {
				color: '#5BA2C5',
				fontStyle: 'italic',
			},
		},
		{
			types: ['comment'],
			style: {
				color: 'rgb(99, 119, 119)',
				fontStyle: 'italic',
			},
		},
		{
			types: ['string', 'url'],
			style: {
				color: '#C2BFFF',
			},
		},
		{
			types: ['punctuation'],
			style: {
				color: '#68768D',
			},
		},
		{
			types: ['selector', 'doctype'],
			style: {
				color: '#94B8FF',
				fontStyle: 'italic',
			},
		},
	], */
};
export default theme;
