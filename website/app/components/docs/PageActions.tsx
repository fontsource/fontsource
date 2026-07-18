import { Group, UnstyledButton } from '@mantine/core';
import { IconCopy, IconFileText, IconRobot } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

import classes from './PageActions.module.css';

type CopyStatus = 'idle' | 'copied' | 'failed';

interface PageActionsProps {
	markdownUrl: string;
}

const copyLabel = (status: CopyStatus) => {
	if (status === 'copied') return 'Copied Markdown';
	if (status === 'failed') return 'Copy failed';
	return 'Copy Markdown';
};

export const PageActions = ({ markdownUrl }: PageActionsProps) => {
	const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');
	const copyStatusTimeout = useRef<number | undefined>(undefined);

	useEffect(
		() => () => {
			window.clearTimeout(copyStatusTimeout.current);
		},
		[],
	);

	const settleCopyStatus = (status: CopyStatus) => {
		window.clearTimeout(copyStatusTimeout.current);
		setCopyStatus(status);
		copyStatusTimeout.current = window.setTimeout(() => {
			setCopyStatus('idle');
		}, 1500);
	};

	const copyPage = async () => {
		try {
			const response = await fetch(markdownUrl);
			if (!response.ok) throw new Error('Markdown request failed');

			const text = await response.text();
			await navigator.clipboard.writeText(text);
			settleCopyStatus('copied');
		} catch {
			settleCopyStatus('failed');
		}
	};

	return (
		<Group
			component="nav"
			className={classes.actions}
			gap={0}
			aria-label="Page actions"
		>
			<UnstyledButton
				type="button"
				className={classes.action}
				onClick={copyPage}
			>
				<IconCopy size={16} stroke={1.8} aria-hidden="true" />
				<span aria-live="polite" aria-atomic="true">
					{copyLabel(copyStatus)}
				</span>
			</UnstyledButton>
			<UnstyledButton
				component="a"
				href={markdownUrl}
				className={classes.action}
			>
				<IconFileText size={16} stroke={1.8} aria-hidden="true" />
				<span>View Markdown</span>
			</UnstyledButton>
			<UnstyledButton component="a" href="/llms.txt" className={classes.action}>
				<IconRobot size={16} stroke={1.8} aria-hidden="true" />
				<span>LLMs.txt</span>
			</UnstyledButton>
		</Group>
	);
};
