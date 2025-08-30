import { Container, Title } from '@mantine/core';
import { Outlet } from 'react-router';

import { ContentHeader } from '@/components/layout/ContentHeader';

import classes from '../styles/global.module.css';

export default function ToolsLayout() {
	return (
		<>
			<ContentHeader>
				<Title order={1} c="purple.0">
					Developer Tools
				</Title>
			</ContentHeader>
			<Container className={classes.container}>
				<Outlet />
			</Container>
		</>
	);
}
