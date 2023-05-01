import { Box, Container, createStyles, Grid } from '@mantine/core';
import { Outlet } from '@remix-run/react';

import { DocsHeader } from '@/components/docs/DocsHeader';
import { LeftSidebar } from '@/components/docs/LeftSidebar';
import { mdxComponents } from '@/utils/mdx/getMdxComponent';

const useStyles = createStyles((theme) => ({
	container: {
		maxWidth: '1440px',
		marginLeft: 'auto',
		marginRight: 'auto',
		padding: '40px 64px',

		[theme.fn.smallerThan('lg')]: {
			padding: '40px 40px',
		},

		[theme.fn.smallerThan('xs')]: {
			padding: '40px 24px',
		},
	},
}));

export default function Docs() {
	const { classes } = useStyles();
	return (
		<>
			<DocsHeader />
			<Box className={classes.container}>
				<Grid columns={24}>
					<Grid.Col span={6}>
						<LeftSidebar />
					</Grid.Col>
					<Grid.Col span="auto">
						<Container>
							<Outlet context={mdxComponents} />
						</Container>
					</Grid.Col>
					<Grid.Col span={6}>Test</Grid.Col>
				</Grid>
			</Box>
		</>
	);
}
