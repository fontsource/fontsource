import { ActionIcon, Tooltip } from '@mantine/core';

import { IconInfo } from '@/components/icons';

interface InfoTooltipProps {
	label: string;
}
export const InfoTooltip = ({ label }: InfoTooltipProps) => {
	return (
		<Tooltip
			multiline
			width={240}
			withArrow
			transitionProps={{ duration: 200 }}
			label={label}
		>
			<ActionIcon variant="transparent" color="gray" radius="xl">
				<IconInfo height={18} />
			</ActionIcon>
		</Tooltip>
	);
};
