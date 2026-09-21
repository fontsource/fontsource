import type { Icon } from '@tabler/icons-react';
import { IconArrowRight } from '@tabler/icons-react';
import { Link } from 'react-router';
import styles from './ToolCard.module.css';

interface ToolCardProps {
	title: string;
	description: string;
	link: string;
	icon: Icon;
}

export const ToolCard = ({
	title,
	description,
	link,
	icon: Icon,
}: ToolCardProps) => {
	return (
		<Link to={link} className={styles.toolCard} prefetch="intent">
			<div className={styles.heading}>
				<Icon size={24} stroke={1.5} aria-hidden />
				<h2>{title}</h2>
				<IconArrowRight
					size={20}
					stroke={1.5}
					aria-hidden
					className={styles.arrow}
				/>
			</div>
			<p className={styles.description}>{description}</p>
		</Link>
	);
};
