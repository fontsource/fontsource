import { Container, createStyles, Stack, Title } from '@mantine/core';

import { IconFly } from '@/components/icons/Fly';
import { IconJsdelivr } from '@/components/icons/Jsdelivr';

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

export default function Sponsors() {
	const { classes } = useStyles();

	return (
		<Container className={classes.container}>
			<Title order={1} fz={40} align="center" mt="xl" mb={48}>
				Community Sponsors
			</Title>
			<Stack spacing={32}>
				<IconFly />
				<IconJsdelivr />
			</Stack>
		</Container>
	);
}
