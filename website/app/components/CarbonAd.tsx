import type { BoxProps } from '@mantine/core';
import { rem } from '@mantine/core';
import { Box, createStyles } from '@mantine/core';
import { useLocation } from '@remix-run/react';
import { useEffect } from 'react';
import Balancer from 'react-wrap-balancer';

const useStyles = createStyles((theme) => ({
	wrapper: {
		display: 'flex',
		marginTop: rem(24),
		marginLeft: 'auto',
		justifyContent: 'center',

		a: {
			color:
				theme.colorScheme === 'dark'
					? theme.colors.text[0]
					: theme.colors.text[1],
			textDecoration: 'none',
		},

		'#carbonads > span': {
			textAlign: 'center',
			display: 'grid',
			padding: '1em',
			boxSizing: 'border-box',
			borderRadius: '4px',
			width: rem(238),
		},

		'#carbonads .carbon-wrap': {
			display: 'grid',
			rowGap: rem(8),
		},

		'#carbonads .carbon-text': {
			fontSize: rem(12),
			marginBottom: rem(4),
		},

		'#carbonads .carbon-poweredby': {
			fontSize: '0.75em',
			opacity: 0.5,
			textTransform: 'uppercase',
			fontWeight: 600,
			letterSpacing: 0.5,
		},
	},
}));

export const CarbonAd = ({ ...props }: BoxProps) => {
	const { classes } = useStyles();
	const location = useLocation();

	useEffect(() => {
		const script = document.createElement('script');
		script.src =
			'//cdn.carbonads.com/carbon.js?serve=CEAI42QN&placement=fontsourceorg';
		script.id = '_carbonads_js';
		script.async = true;
		document.getElementById('carbonads')?.replaceWith(script);
	}, [location]);

	return (
		<Box className={classes.wrapper} {...props}>
			<Balancer>
				<span id="carbonads" />
			</Balancer>
		</Box>
	);
};
