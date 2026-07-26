import { Container } from '@mantine/core';
import { Outlet, useMatch } from 'react-router';

import { ContentHeader } from '@/components/layout/ContentHeader';
import { FontToolsProvider } from '@/components/tools/FontToolsProvider';

import classes from '../styles/global.module.css';

export default function ToolsLayout() {
	const isToolsIndex = useMatch('/tools') !== null;

	return (
		<>
			{isToolsIndex && (
				<ContentHeader
					title="Font Tools"
					description="Convert files or build WOFF2/CSS packages locally."
				/>
			)}
			<Container className={classes.container}>
				{isToolsIndex ? (
					<Outlet />
				) : (
					<FontToolsProvider>
						<Outlet />
					</FontToolsProvider>
				)}
			</Container>
		</>
	);
}
