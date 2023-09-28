import {
	Badge,
	Divider,
	Grid,
	Group,
	Stack,
	Tabs,
	Text,
	Title,
	UnstyledButton,
} from '@mantine/core';
import { Link } from '@remix-run/react';
import millify from 'millify';
import { useState } from 'react';

import { Code } from '@/components/code/Code';
import { PackageManagerCode } from '@/components/code/PackageManagerCode';
import {
	IconDownload,
	IconEdit,
	IconExternal,
	IconGithub,
	IconNpm,
} from '@/components/icons';
import globalClasses from '@/styles/global.module.css';
import type { Metadata, VariableData } from '@/utils/types';

import { CarbonAd } from '../CarbonAd';
import classes from './Install.module.css';

interface InstallProps {
	metadata: Metadata;
	variable?: VariableData;
	downloadCount?: number;
}

const Variable = ({ metadata, variable }: InstallProps) => {
	const [isActive, setActive] = useState<Record<string, boolean>>({
		wght: true,
	});

	// Remove ital from active axes and mark separate ital flag as true
	const activeAxes = Object.keys(isActive).filter((axis) => axis !== 'ital');
	const isItal = isActive.ital;

	// Determine if it is a standard axis e.g. only contains wght, wdth, slnt, opsz or ital
	const isStandard = activeAxes.every((axis) =>
		['wght', 'wdth', 'slnt', 'opsz'].includes(axis),
	);

	const importComment =
		metadata.weights.length === 1
			? `// Supports only weight ${metadata.weights[0]}`
			: `// Supports weights ${metadata.weights[0]}-${
					metadata.weights.at(-1) ?? 400
			  }\n`;

	const generateImports = () => {
		if (activeAxes.length === 1 && isActive.wght) {
			if (isItal)
				return `import '@fontsource-variable/${metadata.id}/wght-italic.css';`;
			return `import '@fontsource-variable/${metadata.id}';`;
		}

		// If it is only wght and another axes, return axes.css
		if (activeAxes.length === 2 && isActive.wght) {
			const selected =
				activeAxes.find((axis) => axis !== 'wght')?.toLowerCase() ?? 'wght';
			if (isItal)
				return `import '@fontsource-variable/${metadata.id}/${selected}-italic.css';`;
			return `import '@fontsource-variable/${metadata.id}/${selected}.css';`;
		}

		// If the selected axes is within standard, only return standard
		if (isStandard)
			return `import '@fontsource-variable/${metadata.id}/standard.css';`;

		// If the selected axes is not within standard, return full
		return `import '@fontsource-variable/${metadata.id}/full.css';`;
	};

	const handleActive = (value: string | number) => {
		setActive((prev) => {
			if (prev[value]) {
				// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
				delete prev[value];
				return {
					...prev,
					wght: true,
				};
			}

			return {
				...prev,
				[value]: !prev[value],
				wght: true,
			};
		});
	};

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
			<Title order={3} mt="xl" mb="md">
				Import
			</Title>
			{variable && (
				<Group>
					{Object.keys(variable.axes).map((axis) => (
						<Badge
							key={axis}
							className={classes.badge}
							onClick={() => {
								handleActive(axis);
							}}
							style={(theme) => ({
								backgroundColor: isActive[axis]
									? theme.colors.purple[0]
									: undefined,
								color: isActive[axis] ? theme.colors.text[0] : undefined,
							})}
						>
							{axis}
						</Badge>
					))}
				</Group>
			)}
			<Code language="jsx">{importComment + generateImports()}</Code>
			<Title order={3} mt="xl" mb="md">
				CSS
			</Title>
			<Text>
				Include the CSS in your project by adding the following line to your
				project:
			</Text>
			<Code language="css">
				{`body {
  font-family: '${metadata.family} Variable', sans-serif;
}`}
			</Code>
		</>
	);
};

const Static = ({ metadata }: InstallProps) => {
	const [isActive, setActive] = useState<Record<string, boolean>>({
		400: true,
	});
	const keys = Object.keys(isActive);
	const handleActive = (value: string | number) => {
		setActive((prev) => {
			if (keys.length === 1 && prev[value]) return prev;
			if (prev[value]) {
				// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
				delete prev[value];
				return {
					...prev,
				};
			}

			return {
				...prev,
				[value]: !prev[value],
			};
		});
	};

	const [isItal, setIsItal] = useState(false);
	const generateImports = () => {
		let imports = '';
		if (keys.length === 1 && isActive[400]) {
			if (isItal) return `import '@fontsource/${metadata.id}/400-italic.css';`;
			return `import '@fontsource/${metadata.id}';`;
		}

		for (const weight of keys) {
			imports += isItal
				? `import '@fontsource/${metadata.id}/${weight}-italic.css';\n`
				: `import '@fontsource/${metadata.id}/${weight}.css';\n`;
		}
		return imports.trim();
	};

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
			<Title order={3} mt="xl" mb="md">
				Import
			</Title>
			<Group>
				{metadata.weights.map((weight) => (
					<Badge
						key={weight}
						className={classes.badge}
						onClick={() => {
							handleActive(weight);
						}}
						style={(theme) => ({
							backgroundColor: isActive[weight]
								? theme.colors.purple[0]
								: undefined,
							color: isActive[weight] ? theme.colors.text[0] : undefined,
						})}
					>
						{weight}
					</Badge>
				))}
				{metadata.styles.includes('italic') && (
					<Badge
						className={classes.badge}
						onClick={() => {
							setIsItal((prev) => !prev);
						}}
						style={(theme) => ({
							backgroundColor: isItal ? theme.colors.purple[0] : undefined,
							color: isItal ? theme.colors.text[0] : undefined,
						})}
					>
						italic
					</Badge>
				)}
			</Group>
			<Code language="jsx">{generateImports()}</Code>
			<Title order={3} mt="xl" mb="md">
				CSS
			</Title>
			<Text>
				Include the CSS in your project by adding the following line to your
				project:
			</Text>
			<Code language="css">
				{`body {
  font-family: '${metadata.family}', sans-serif;
}`}
			</Code>
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
		<Grid className={globalClasses.wrapper}>
			<Grid.Col span={{ base: 12, md: 8 }}>
				<Group justify="apart" mb={28}>
					<Title>Getting Started</Title>
					<UnstyledButton
						component={Link}
						className={classes['install-button']}
						to="/docs/getting-started/install"
					>
						<Group gap="xs">
							Documentation
							<IconExternal stroke="white" />
						</Group>
					</UnstyledButton>
				</Group>
				<Tabs
					defaultValue={variable ? 'variable' : 'static'}
					className={classes.tabs}
				>
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
				<div className={classes.infoWrapper}>
					<Text fw={700} fz={15}>
						Font Details
					</Text>
					<Divider my={12} />
					<Stack gap={8}>
						<Group gap="xs">
							<IconDownload />
							<Text>
								Downloads:{' '}
								{downloadCount
									? millify(downloadCount, { precision: 2 })
									: 'N/A'}
							</Text>
						</Group>
						<Group gap="xs">
							<IconEdit />
							<Text>Last Modified: {metadata.lastModified}</Text>
						</Group>
						<Group
							className={classes['info-button-group']}
							justify="apart"
							grow
						>
							<UnstyledButton
								component="a"
								className={classes.infoButton}
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
								className={classes.infoButton}
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
				<CarbonAd w={332} />
			</Grid.Col>
		</Grid>
	);
};
