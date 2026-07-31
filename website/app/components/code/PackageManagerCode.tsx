import { Tabs } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';

import { deserializeStoredChoice } from '@/utils/browser-storage';
import {
	getPackageManagerCommands,
	packageManagers,
} from '@/utils/docs/packageManagers';

import { CodeHighlight, CodeWrapper } from './Code';
import classes from './PackageManagerCode.module.css';

export interface PackageManagerProps {
	cmd: string;
}

export const PackageManagerCode = ({ cmd }: PackageManagerProps) => {
	const commands = getPackageManagerCommands(cmd);
	const packageManagerValues = packageManagers.map((manager) => manager.value);

	const [packageManager, setPackageManager] = useLocalStorage({
		key: 'package-manager',
		defaultValue: 'npm',
		deserialize: (value) =>
			deserializeStoredChoice(value, packageManagerValues, 'npm'),
	});

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
