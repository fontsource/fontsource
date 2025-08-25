import type { BoxProps } from '@mantine/core';
import { Box } from '@mantine/core';
import { useLocation } from 'react-router';
import { useEffect } from 'react';
import Balancer from 'react-wrap-balancer';

import classes from './CarbonAd.module.css';

export const CarbonAd = ({ ...props }: BoxProps) => {
	const location = useLocation();

	// We need to rerender the carbon ad when the route changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: Selective.
	useEffect(() => {
		const script = document.createElement('script');
		script.src =
			'//cdn.carbonads.com/carbon.js?serve=CEAI42QN&placement=fontsourceorg';
		script.id = '_carbonads_js';
		script.async = true;
		document.querySelector('#carbonads')?.replaceWith(script);
	}, [location]);

	return (
		<Box className={classes.wrapper} {...props}>
			<Balancer>
				<span id="carbonads" />
			</Balancer>
		</Box>
	);
};
