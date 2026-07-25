import { Container } from '@mantine/core';
import { Outlet } from 'react-router';

import { ContentHeader } from '@/components/layout/ContentHeader';

import classes from '../styles/global.module.css';

export default function ToolsLayout() {
	return (
		<>
			<ContentHeader
				title="Developer Tools"
				description="Utilities for working with font files directly in your browser."
			/>
			<Container className={classes.container}>
				<Outlet />
			</Container>
		</>
	);
}
