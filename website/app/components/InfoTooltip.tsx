import { ActionIcon, Tooltip } from '@mantine/core';

import { IconInfo } from '@/components/icons';

interface InfoTooltipProps {
	label: string;
	ariaLabel: string;
}
export const InfoTooltip = ({ label, ariaLabel }: InfoTooltipProps) => {
	return (
		<Tooltip
			multiline
			w={300}
			withArrow
			openDelay={300}
			closeDelay={100}
			events={{ hover: true, focus: true, touch: true }}
			transitionProps={{ duration: 200 }}
			label={label}
		>
			<ActionIcon
				variant="transparent"
				radius="xl"
				size={44}
				aria-label={ariaLabel}
			>
				<IconInfo aria-hidden height={17} />
			</ActionIcon>
		</Tooltip>
	);
};
