import type { CodeProps } from '@mantine/core';
import { Tabs } from '@mantine/core';

import { CodeHighlight, CodeWrapper } from './Code';

interface PackageManagerProps extends CodeProps {
	cmd: string;
}

export const PackageManagerCode = ({ cmd, ...props }: PackageManagerProps) => {
	const language = 'sh';
	return (
		<Tabs defaultValue="npm">
			<Tabs.List>
				<Tabs.Tab value="npm">npm</Tabs.Tab>
				<Tabs.Tab value="yarn">yarn</Tabs.Tab>
				<Tabs.Tab value="pnpm">pnpm</Tabs.Tab>
			</Tabs.List>

			<Tabs.Panel value="npm" pt="xs">
				<CodeWrapper language={language} code={'npm install ' + cmd} {...props}>
					<CodeHighlight language={language} code={'npm install ' + cmd} />
				</CodeWrapper>
			</Tabs.Panel>
			<Tabs.Panel value="yarn" pt="xs">
				<CodeWrapper language={language} code={'yarn add ' + cmd} {...props}>
					<CodeHighlight language={language} code={'yarn add ' + cmd} />
				</CodeWrapper>
			</Tabs.Panel>
			<Tabs.Panel value="pnpm" pt="xs">
				<CodeWrapper language={language} code={'pnpm install ' + cmd} {...props}>
					<CodeHighlight language={language} code={'pnpm install ' + cmd} />
				</CodeWrapper>
			</Tabs.Panel>
		</Tabs>
	);
};
