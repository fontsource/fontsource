import type { CodeProps } from '@mantine/core';
import { Tabs } from '@mantine/core';

import { CodeHighlight, CodeWrapper } from './Code';
import classes from './PackageManagerCode.module.css';

interface PackageManagerProps extends Partial<CodeProps> {
	cmd: string;
}

export const PackageManagerCode = ({ cmd, ...props }: PackageManagerProps) => {
	const language = 'sh';
	return (
		<Tabs defaultValue="npm" className={classes.wrapper}>
			<Tabs.List>
				<Tabs.Tab value="npm">npm</Tabs.Tab>
				<Tabs.Tab value="yarn">yarn</Tabs.Tab>
				<Tabs.Tab value="pnpm">pnpm</Tabs.Tab>
				<Tabs.Tab value="bun">bun</Tabs.Tab>
			</Tabs.List>

			<div className={classes.panels}>
				<Tabs.Panel value="npm" pt="xs">
					<CodeWrapper
						language={language}
						code={'npm install ' + cmd}
						{...props}
					>
						<CodeHighlight language={language} code={'npm install ' + cmd} />
					</CodeWrapper>
				</Tabs.Panel>
				<Tabs.Panel value="yarn" pt="xs">
					<CodeWrapper language={language} code={'yarn add ' + cmd} {...props}>
						<CodeHighlight language={language} code={'yarn add ' + cmd} />
					</CodeWrapper>
				</Tabs.Panel>
				<Tabs.Panel value="pnpm" pt="xs">
					<CodeWrapper language={language} code={'pnpm add ' + cmd} {...props}>
						<CodeHighlight language={language} code={'pnpm add ' + cmd} />
					</CodeWrapper>
				</Tabs.Panel>
				<Tabs.Panel value="bun" pt="xs">
					<CodeWrapper language={language} code={'bun add ' + cmd} {...props}>
						<CodeHighlight language={language} code={'bun add ' + cmd} />
					</CodeWrapper>
				</Tabs.Panel>
			</div>
		</Tabs>
	);
};
