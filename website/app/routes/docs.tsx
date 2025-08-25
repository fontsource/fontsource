import { Box, Container, Grid } from '@mantine/core';
import { Outlet } from 'react-router';

import { DocsHeader } from '@/components/docs/DocsHeader';
import { LeftSidebar } from '@/components/docs/LeftSidebar';
import { TableOfContents } from '@/components/docs/TableOfContents';

import classes from '../styles/global.module.css';

export default function Docs() {
	return (
		<>
			<DocsHeader />
			<Box className={classes.container}>
				<Grid>
					<Grid.Col
						span={{ base: 0, sm: 4, md: 3 }}
						className={classes['hide-less-than-sm']}
					>
						<LeftSidebar />
					</Grid.Col>
					<Grid.Col span={{ base: 12, sm: 8, md: 9, xl: 6 }}>
						<Container component="article">
							<Outlet />
						</Container>
					</Grid.Col>
					<Grid.Col
						span={{ base: 0, xl: 3 }}
						className={classes['hide-less-than-xl']}
					>
						<TableOfContents />
					</Grid.Col>
				</Grid>
			</Box>
		</>
	);
}
