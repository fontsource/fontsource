import type { ReactNode } from 'react';
import classes from './FontWorkbench.module.css';

export const ToolOptions = ({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) => (
	<fieldset className={classes.fieldset}>
		<legend className={classes.legend}>{title}</legend>
		{children}
	</fieldset>
);
