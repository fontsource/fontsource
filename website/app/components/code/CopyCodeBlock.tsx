import { CodeHighlight, CodeWrapper } from './Code';
import classes from './CopyCodeBlock.module.css';

interface CopyCodeBlockProps {
	code: string;
	description?: string;
	label: string;
	language: string;
	scrollable?: boolean;
}

const CopyCodeBlock = ({
	code,
	description,
	label,
	language,
	scrollable = false,
}: CopyCodeBlockProps) => {
	const highlightedCode = <CodeHighlight code={code} language={language} />;

	return (
		<div className={classes.root} translate="no">
			<span className={classes.label}>{label}</span>
			{description && (
				<span className={classes.description}>{description}</span>
			)}
			<CodeWrapper language={language} code={code}>
				{scrollable ? (
					<section
						className={classes.scroller}
						aria-label={`${label} code`}
						// biome-ignore lint/a11y/noNoninteractiveTabindex: The overflow region must be keyboard-scrollable.
						tabIndex={0}
					>
						{highlightedCode}
					</section>
				) : (
					highlightedCode
				)}
			</CodeWrapper>
		</div>
	);
};

export { CopyCodeBlock };
