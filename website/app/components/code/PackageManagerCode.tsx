import { Tabs } from '@mantine/core';

import { packageManagers } from '@/utils/docs/packageManagers';

import { CodeHighlight, CodeWrapper } from './Code';
import classes from './PackageManagerCode.module.css';

export interface PackageManagerProps {
	cmd: string;
}

export const PackageManagerCode = ({ cmd }: PackageManagerProps) => (
	<Tabs defaultValue="npm" className={classes.wrapper}>
		<Tabs.List>
			{packageManagers.map(({ value }) => (
				<Tabs.Tab value={value} key={value}>
					{value}
				</Tabs.Tab>
			))}
		</Tabs.List>

		<div className={classes.panels}>
			{packageManagers.map(({ value, command }) => {
				const code = command(cmd);

				return (
					<Tabs.Panel value={value} pt="xs" key={value}>
						<CodeWrapper language="sh" code={code}>
							<CodeHighlight code={code} />
						</CodeWrapper>
					</Tabs.Panel>
				);
			})}
		</div>
	</Tabs>
);
