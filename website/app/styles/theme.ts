import type { MantineThemeOverride } from '@mantine/core';

export const theme: MantineThemeOverride = {
	colors: {
		purple: ['#625BF8', '#625BF8', '#625BF8', '#625BF8', '#625BF8', '#625BF8', '#625BF8', '#625BF8', '#625BF8'],
		purpleHover: ['rgba(98, 91, 248, 0.1)'],
		// Light Dark
		'text': ['#fff', '#01112C'],
		'background': ['#fff', '#F5F7F9', '#E6EBF0', '#172138', '#121B31', '#0F1626'],
		'border': ['#E1E3EC', '#2C3651'],
		'button': ['#E1E3EC', '#101728']
	},
	primaryColor: 'purple',

	fontFamily: 'InterVariable, sans-serif',
	fontFamilyMonospace: '\'Source Code ProVariable\', monospace',

	fontSizes: {
		md: 15,
		lg: 32
	},
};