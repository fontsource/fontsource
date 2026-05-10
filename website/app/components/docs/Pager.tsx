import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import { Link } from 'react-router';

import type { Pager as PagerData } from '@/utils/docs/navigation';

import classes from './Pager.module.css';

interface PagerProps {
	pager: PagerData;
}

export const Pager = ({ pager }: PagerProps) => (
	<nav className={classes.pager} aria-label="Documentation pagination">
		{pager.previous ? (
			<Link to={pager.previous.url} className={classes.card} prefetch="render">
				<IconArrowLeft size={18} stroke={1.8} aria-hidden="true" />
				<span>
					<small>Previous</small>
					<strong>{pager.previous.name}</strong>
				</span>
			</Link>
		) : (
			<span />
		)}
		{pager.next ? (
			<Link
				to={pager.next.url}
				className={classes.card}
				prefetch="render"
				data-align="end"
			>
				<span>
					<small>Next</small>
					<strong>{pager.next.name}</strong>
				</span>
				<IconArrowRight size={18} stroke={1.8} aria-hidden="true" />
			</Link>
		) : (
			<span />
		)}
	</nav>
);
