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

const formatFontLabel = (value: string) =>
	value
		.split(/[-_/]/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');

const getAxisLabel = (axis: string) => axisLabels[axis] ?? axis.toUpperCase();

export { formatFontLabel, getAxisLabel };
