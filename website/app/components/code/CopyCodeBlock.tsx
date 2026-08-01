import { useClipboard } from '@mantine/hooks';

import { IconCopy } from '@/components/icons';

import classes from './CopyCodeBlock.module.css';

interface CopyCodeBlockProps {
	code: string;
	label: string;
}

const CopyCodeBlock = ({ code, label }: CopyCodeBlockProps) => {
	const clipboard = useClipboard({ timeout: 1500 });
	const copyLabel = clipboard.copied
		? 'Copied'
		: clipboard.error
			? 'Copy failed'
			: 'Copy';

	return (
		<div className={classes.root} translate="no">
			<div className={classes.header}>
				<span>{label}</span>
				<button type="button" onClick={() => clipboard.copy(code)}>
					<IconCopy aria-hidden height={16} stroke="currentColor" />
					<span aria-live="polite" aria-atomic="true">
						{copyLabel}
					</span>
				</button>
			</div>
			<pre>
				<code>{code}</code>
			</pre>
		</div>
	);
};

export { CopyCodeBlock };
