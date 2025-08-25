import { ActionIcon, Portal, Transition } from '@mantine/core';
import { useEffect, useState } from 'react';

import { IconUp } from '../icons/Up';
import classes from './ScrollToTop.module.css';

interface ScrollToTopProps {
	containerId: string;
	targetRef: React.RefObject<HTMLElement | null>;
}

const scrollUp = () => {
	window.scrollTo({
		top: 0,
		behavior: 'smooth',
	});
};

const ScrollToTop = ({ containerId, targetRef }: ScrollToTopProps) => {
	const [showButton, setShowButton] = useState(false);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				setShowButton(!entry.isIntersecting);
			},
			{ threshold: 0.5 },
		);

		const targetNode = targetRef.current;
		if (targetNode) {
			observer.observe(targetNode);
		}

		return () => {
			if (targetNode) {
				observer.unobserve(targetNode);
			}
		};
	}, [targetRef]);

	return (
		<Transition
			mounted={showButton}
			transition="fade-up"
			duration={300}
			timingFunction="ease"
		>
			{(styles) => (
				<Portal target={containerId}>
					<ActionIcon
						style={styles}
						className={classes.button}
						onClick={scrollUp}
						aria-label="Scroll to top"
					>
						<IconUp height={24} width={24} />
					</ActionIcon>
				</Portal>
			)}
		</Transition>
	);
};

export { ScrollToTop };
