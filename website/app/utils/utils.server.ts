// We need know if a variable font may be a standard or variable font
const STANDARD_AXES = ['opsz', 'slnt', 'wdth', 'wght'] as const;
type StandardAxes = (typeof STANDARD_AXES)[number];

export const isStandardAxesKey = (axesKey: string): axesKey is StandardAxes =>
	STANDARD_AXES.includes(axesKey as StandardAxes);
