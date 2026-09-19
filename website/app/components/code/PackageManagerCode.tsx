import { Tabs } from '@mantine/core';

import { usePackageManager } from '@/hooks/usePackageManager';
import { getPackageManagerCommands } from '@/utils/docs/packageManagers';

import { CodeHighlight, CodeWrapper } from './Code';
import classes from './PackageManagerCode.module.css';

export interface PackageManagerProps {
	cmd: string;
}

export const PackageManagerCode = ({ cmd }: PackageManagerProps) => {
	const commands = getPackageManagerCommands(cmd);

	const [packageManager, setPackageManager] = usePackageManager('npm');

	return (
		<Tabs
			value={packageManager}
			onChange={(value) => {
				if (value) setPackageManager(value);
			}}
			className={classes.wrapper}
			classNames={{ tab: classes.tab }}
		>
			<Tabs.List>
				{commands.map(({ value }) => (
					<Tabs.Tab value={value} key={value}>
						{value}
					</Tabs.Tab>
				))}
			</Tabs.List>

			<div className={classes.panels}>
				{commands.map(({ value, command }) => (
					<Tabs.Panel value={value} pt="xs" key={value}>
						<CodeWrapper language="sh" code={command}>
							<CodeHighlight code={command} language="sh" />
						</CodeWrapper>
					</Tabs.Panel>
				))}
			</div>
		</Tabs>
	);
};
