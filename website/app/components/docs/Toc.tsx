import { Stack } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';
import type { TOCItemType } from 'fumadocs-core/toc';
import { AnchorProvider, TOCItem } from 'fumadocs-core/toc';

import classes from './Toc.module.css';

interface TocProps {
	toc: TOCItemType[];
	editUrl: string;
}

export const Toc = ({ toc, editUrl }: TocProps) => (
	<aside className={classes.aside}>
		{toc.length > 0 && (
			<AnchorProvider toc={toc} single>
				<nav className={classes.toc} aria-label="On this page">
					<p className={classes.title}>On this page</p>
					{toc.map((item) => (
						<TOCItem
							key={item.url}
							href={item.url}
							className={classes.item}
							style={
								{
									'--depth': Math.max(item.depth - 2, 0),
								} as React.CSSProperties
							}
						>
							{item.title}
						</TOCItem>
					))}
				</nav>
			</AnchorProvider>
		)}
		<Stack className={classes.actions} gap={9}>
			<a
				href={editUrl}
				target="_blank"
				rel="noreferrer"
				className={classes.action}
			>
				<span>Edit this page on GitHub</span>
				<IconExternalLink size={14} stroke={1.8} />
			</a>
		</Stack>
	</aside>
);
