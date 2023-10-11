import { Divider, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import millify from 'millify';

import {
	IconDownload,
	IconEdit,
	IconGithub,
	IconNpm,
} from '@/components/icons';
import { type Metadata } from '@/utils/types';

import classes from './Info.module.css';

interface InfoProps {
	metadata: Metadata;
	isCDN?: boolean;
	hits?: number;
}

export const InfoWrapper = ({ metadata, isCDN, hits }: InfoProps) => {
	return (
		<div className={classes.wrapper}>
			<Text fw={700} fz={15}>
				Font Details
			</Text>
			<Divider my={12} />
			<Stack gap={8}>
				<Group gap="xs">
					<IconDownload />
					<Text>
						{isCDN ? 'CDN Hits' : 'Downloads'}:{' '}
						{hits ? millify(hits, { precision: 2 }) : 'N/A'}
					</Text>
				</Group>
				<Group gap="xs">
					<IconEdit />
					<Text>Last Modified: {metadata.lastModified}</Text>
				</Group>
				<Group className={classes['button-group']} justify="space-between" grow>
					<UnstyledButton
						component="a"
						className={classes.button}
						href={`https://github.com/fontsource/font-files/tree/main/fonts/${
							metadata.category === 'icons' ? 'icons' : metadata.type
						}/${metadata.id}`}
						target="_blank"
					>
						<Group>
							<IconGithub />
							Github
						</Group>
					</UnstyledButton>
					<UnstyledButton
						component="a"
						className={classes.button}
						href={`https://www.npmjs.com/package/@fontsource/${metadata.id}`}
						target="_blank"
					>
						<Group>
							<IconNpm />
							NPM
						</Group>
					</UnstyledButton>
				</Group>
			</Stack>
		</div>
	);
};
