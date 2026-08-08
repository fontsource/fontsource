import { CodeHighlight, CodeWrapper } from './Code';
import classes from './CopyCodeBlock.module.css';

interface CopyCodeBlockProps {
	code: string;
	description?: string;
	label: string;
	language: string;
}

const CopyCodeBlock = ({
	code,
	description,
	label,
	language,
}: CopyCodeBlockProps) => (
	<div className={classes.root} translate="no">
		<span className={classes.label}>{label}</span>
		{description && <span className={classes.description}>{description}</span>}
		<CodeWrapper language={language} code={code}>
			<CodeHighlight code={code} language={language} />
		</CodeWrapper>
	</div>
);

export { CopyCodeBlock };
