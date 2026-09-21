import { Container } from '@mantine/core';
import { Outlet, useMatch } from 'react-router';

import { FontToolsProvider } from '@/components/tools/FontToolsProvider';

import classes from '../styles/global.module.css';

export default function ToolsLayout() {
	const isToolsIndex = useMatch('/tools') !== null;

	if (isToolsIndex) return <Outlet />;

	return (
		<Container className={classes.container}>
			<FontToolsProvider>
				<Outlet />
			</FontToolsProvider>
		</Container>
	);
}
