import { Grid, Group, Tabs, Text, Title, UnstyledButton } from '@mantine/core';
import { Link } from 'react-router';

import { PackageManagerCode } from '@/components/code/PackageManagerCode';
import { IconExternal } from '@/components/icons';
import globalClasses from '@/styles/global.module.css';
import type { Metadata, VariableData } from '@/utils/types';

import { CarbonAd } from '../CarbonAd';
import { InfoWrapper } from './Info';
import classes from './Install.module.css';
import { InstallCode } from './InstallCode';

interface InstallProps {
	metadata: Metadata;
	variable?: VariableData;
	downloadCount?: number;
}

const Variable = ({ metadata, variable }: InstallProps) => {
	return (
		<>
			<Title order={3} mt="xl" mb="md">
				Installation
			</Title>
			<Text>
				Install the variable version of this font by running the following
				command:
			</Text>
			<PackageManagerCode cmd={`@fontsource-variable/${metadata.id}`} />
			<InstallCode metadata={metadata} variable={variable} />
		</>
	);
};

const Static = ({ metadata }: InstallProps) => {
	return (
		<>
			<Title order={3} mt="xl" mb="md">
				Installation
			</Title>
			<Text>
				Install the static version of this font by running the following
				command:
			</Text>
			<PackageManagerCode cmd={`@fontsource/${metadata.id}`} />
			<InstallCode metadata={metadata} />
		</>
	);
};

export const Install = ({
	metadata,
	variable,
	downloadCount,
}: InstallProps) => {
	// TODO: Readd attribution to metadata
	/**
	// Replace any urls as well as () and <> with empty string
	const replaceAttribution = metadata.license.attribution
		.replace(/https?:\/\/[\S\n]+/g, '')
		.replace(/([()<>])/g, '')
		// Also replace emails
		.replace(/[\w.]+@[\w.]+/g, '');

		<Text>&copy; {replaceAttribution}</Text>

		<Group spacing="xs">
							<IconVersion />
							<Text>Version: {metadata.version}</Text>
						</Group>
 */

	return (
		<Grid className={globalClasses.container}>
			<Grid.Col span={{ base: 12, md: 8 }}>
				<Group justify="space-between" mb={28}>
					<Title>Getting Started</Title>
					<UnstyledButton
						component={Link}
						className={classes.button}
						to="/docs/getting-started/install"
					>
						<Group gap="xs">
							Documentation
							<IconExternal stroke="white" />
						</Group>
					</UnstyledButton>
				</Group>
				<Tabs defaultValue={variable ? 'variable' : 'static'}>
					<Tabs.List>
						{variable && <Tabs.Tab value="variable">Variable</Tabs.Tab>}
						<Tabs.Tab value="static">Static</Tabs.Tab>
					</Tabs.List>

					<Tabs.Panel value="variable">
						<Variable metadata={metadata} variable={variable} />
					</Tabs.Panel>
					<Tabs.Panel value="static">
						<Static metadata={metadata} />
					</Tabs.Panel>
				</Tabs>
			</Grid.Col>
			<Grid.Col span={{ base: 12, md: 4 }}>
				<InfoWrapper metadata={metadata} hits={downloadCount} />
				<CarbonAd w={332} />
			</Grid.Col>
		</Grid>
	);
};
