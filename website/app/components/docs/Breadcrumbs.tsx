import { IconChevronRight } from '@tabler/icons-react';
import { Link } from 'react-router';

import type { Breadcrumb } from '@/utils/docs/navigation';

import classes from './Breadcrumbs.module.css';

interface BreadcrumbsProps {
	items: Breadcrumb[];
}

export const Breadcrumbs = ({ items }: BreadcrumbsProps) => (
	<nav className={classes.breadcrumbs} aria-label="Breadcrumb">
		{items.map((item, index) => (
			<span key={item.url ?? item.name}>
				{item.url && index < items.length - 1 ? (
					<Link to={item.url}>{item.name}</Link>
				) : (
					<span>{item.name}</span>
				)}
				{index < items.length - 1 && (
					<IconChevronRight size={14} stroke={1.8} />
				)}
			</span>
		))}
	</nav>
);
