import { Box, Container, createStyles, Grid } from '@mantine/core';
import { Outlet } from '@remix-run/react';

import { DocsHeader } from '@/components/docs/DocsHeader';
import { LeftSidebar } from '@/components/docs/LeftSidebar';
import { TableOfContents } from '@/components/docs/TableOfContents';
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
				<Grid>
					<Grid.Col
						span={0}
						sm={4}
						md={3}
						sx={(theme) => ({
							[theme.fn.smallerThan('sm')]: {
								display: 'none',
							},
						})}
					>
						<LeftSidebar />
					</Grid.Col>
					<Grid.Col span={12} sm={8} md={9} xl={6}>
						<Container>
							<Outlet context={mdxComponents} />
						</Container>
					</Grid.Col>
					<Grid.Col
						span={0}
						xl={3}
						sx={(theme) => ({
							[theme.fn.smallerThan('xl')]: {
								display: 'none',
							},
						})}
					>
						<TableOfContents />
					</Grid.Col>
				</Grid>
			</Box>
		</>
	);
}
