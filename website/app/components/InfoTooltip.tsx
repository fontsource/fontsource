import { ActionIcon, Tooltip } from '@mantine/core';

import { IconInfo } from '@/components/icons';

interface InfoTooltipProps {
	label: string;
}
export const InfoTooltip = ({ label }: InfoTooltipProps) => {
	return (
		<Tooltip
			multiline
			w={240}
			withArrow
			transitionProps={{ duration: 200 }}
			label={label}
		>
			<ActionIcon variant="transparent" radius="xl">
				<IconInfo height={19} />
			</ActionIcon>
		</Tooltip>
	);
};
