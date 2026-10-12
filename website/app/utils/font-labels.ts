const axisLabels: Record<string, string> = {
	CASL: 'Casual',
	CRSV: 'Cursive',
	FILL: 'Fill',
	GRAD: 'Grade',
	MONO: 'Monospace',
	SOFT: 'Softness',
	WONK: 'Wonky',
	opsz: 'Optical size',
	slnt: 'Slant',
	wdth: 'Width',
	wght: 'Weight',
};

const fontWeightNames: Readonly<Record<number, string>> = {
	100: 'Thin',
	200: 'Extra light',
	300: 'Light',
	400: 'Regular',
	500: 'Medium',
	600: 'Semibold',
	700: 'Bold',
	800: 'Extra bold',
	900: 'Black',
};

const formatFontLabel = (value: string) =>
	value
		.split(/[-_/]/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');

const getAxisLabel = (axis: string) => axisLabels[axis] ?? axis.toUpperCase();

export { fontWeightNames, formatFontLabel, getAxisLabel };
