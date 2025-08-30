import { Card, Group, Text, Title } from '@mantine/core';
import type { Icon } from '@tabler/icons-react';
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
		<Card
			component={Link}
			to={link}
			padding="xl"
			radius="md"
			className={styles.toolCard}
		>
			<Group>
				<Icon />
			</Group>
			<Title order={3} mt="md">
				{title}
			</Title>
			<Text size="sm" c="dimmed" mt="sm">
				{description}
			</Text>
		</Card>
	);
};
