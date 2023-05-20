import {
	Badge,
	createStyles,
	Divider,
	Grid,
	Group,
	rem,
	Stack,
	Tabs,
	Text,
	Title,
	UnstyledButton,
} from '@mantine/core';
import { Link } from '@remix-run/react';
import millify from 'millify';
import { useState } from 'react';

import {
	IconDownload,
	IconEdit,
	IconExternal,
	IconGithub,
	IconNpm,
	IconVersion,
} from '@/components';
import { Code } from '@/components/code/Code';
import { PackageManagerCode } from '@/components/code/PackageManagerCode';
import type { Metadata, VariableData } from '@/utils/types';

const useStyles = createStyles((theme) => ({
	wrapper: {
		maxWidth: '1440px',
		marginLeft: 'auto',
		marginRight: 'auto',
		padding: '40px 64px',

		[theme.fn.smallerThan('lg')]: {
			padding: '40px 40px',
		},

		[theme.fn.smallerThan('xs')]: {
			padding: '40px 24px',
		},
	},

	badge: {
		padding: `${rem(4)} ${rem(8)}`,
		gap: rem(10),
		color:
			theme.colorScheme === 'dark'
				? theme.colors.text[0]
				: theme.colors.text[1],
		backgroundColor:
			theme.colorScheme === 'dark'
				? theme.colors.background[3]
				: theme.colors.background[2],
		borderRadius: rem(4),
		fontFamily: theme.fontFamilyMonospace,
		textTransform: 'lowercase',
		userSelect: 'none',
		cursor: 'pointer',
	},

	infoWrapper: {
		width: rem(332),
		padding: rem(24),
		border:
			theme.colorScheme === 'dark'
				? `${rem(1)} solid ${theme.colors.border[1]}`
				: `${rem(1)} solid ${theme.colors.border[0]}`,
		borderRadius: rem(4),
		marginLeft: 'auto',
	},

	infoButton: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		padding: `${rem(8)} ${rem(16)}`,
		border:
			theme.colorScheme === 'dark'
				? `${rem(1)} solid ${theme.colors.border[1]}`
				: `${rem(1)} solid ${theme.colors.border[0]}`,
		borderRadius: rem(4),

		'&:hover': {
			backgroundColor:
				theme.colorScheme === 'dark'
					? theme.fn.darken(theme.colors.background[4], 0.5)
					: theme.fn.lighten(theme.colors.purple[0], 0.98),
		},
	},

	installWrapper: {
		padding: `${rem(24)} ${rem(40)} ${rem(24)} ${rem(24)}`,
		width: '100%',
	},

	installButton: {
		padding: `${rem(8)} ${rem(16)}`,
		borderRadius: rem(4),
		backgroundColor: theme.colors.purple[0],
		color: theme.colors.text[0],

		'&:hover': {
			backgroundColor: theme.fn.darken(theme.colors.purple[0], 0.2),
		},
	},
}));

interface InstallProps {
	metadata: Metadata;
	variable?: VariableData;
	downloadCount?: number;
}

const Variable = ({ metadata, variable }: InstallProps) => {
	const { classes } = useStyles();

	const [isActive, setActive] = useState<Record<string, boolean>>({
		wght: true,
	});

	// Remove ital from active axes and mark separate ital flag as true
	const activeAxes = Object.keys(isActive).filter((axis) => axis !== 'ital');
	const isItal = isActive.ital;

	// Determine if it is a standard axis e.g. only contains wght, wdth, slnt, opsz or ital
	const isStandard = activeAxes.every((axis) =>
		['wght', 'wdth', 'slnt', 'opsz'].includes(axis)
	);

	const importComment = `// Supports weights ${
		metadata.weights[0]
	}-${metadata.weights.at(-1)}\n`;
	const generateImports = () => {
		if (activeAxes.length === 1 && isActive.wght) {
			if (isItal)
				return `import '@fontsource-variable/${metadata.id}/wght-italic.css';`;
			return `import '@fontsource-variable/${metadata.id}';`;
		}

		// If it is only wght and another axes, return axes.css
		if (activeAxes.length === 2 && isActive.wght) {
			const selected = activeAxes
				.filter((axis) => axis !== 'wght')[0]
				.toLowerCase();
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
					{Object.keys(variable).map((axis) => (
						<Badge
							key={axis}
							className={classes.badge}
							onClick={() => handleActive(axis)}
							sx={(theme) => ({
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
	const { classes } = useStyles();

	const [isActive, setActive] = useState<Record<string, boolean>>({
		400: true,
	});
	const keys = Object.keys(isActive);
	const handleActive = (value: string | number) => {
		setActive((prev) => {
			if (keys.length === 1 && prev[value]) return prev;
			if (prev[value]) {
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

		keys.forEach((weight) => {
			if (isItal)
				imports += `import '@fontsource/${metadata.id}/${weight}-italic.css';\n`;
			else imports += `import '@fontsource/${metadata.id}/${weight}.css';\n`;
		});
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
						onClick={() => handleActive(weight)}
						sx={(theme) => ({
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
						onClick={() => setIsItal((prev) => !prev)}
						sx={(theme) => ({
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
	const { classes } = useStyles();

	// Replace any urls as well as () and <> with empty string
	const replaceAttribution = metadata.license.attribution
		.replace(/(?:https?):\/\/[\n\S]+/g, '')
		.replace(/(\(|\)|<|>)/g, '')
		// Also replace emails
		.replace(/[\w.]+@[\w.]+/g, '');

	return (
		<Grid className={classes.wrapper}>
			<Grid.Col span={8}>
				<Group position="apart" mb={28}>
					<Title>Getting Started</Title>
					<UnstyledButton
						component={Link}
						className={classes.installButton}
						to="/docs/getting-started/install"
					>
						<Group spacing="xs">
							Documentation
							<IconExternal stroke="white" />
						</Group>
					</UnstyledButton>
				</Group>
				<Tabs defaultValue={variable ? 'variable' : 'static'} styles={(theme) => ({
				tab: {
					'&[data-active]': {
						borderBottom: `${rem(2)} solid ${theme.colors.purple[0]}`,
					},
				},
			})}>
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
			<Grid.Col span={4}>
				<div className={classes.infoWrapper}>
					<Text fw={700} fz={15}>
						Font Details
					</Text>
					<Divider my={12} />
					<Stack spacing={8}>
						<Group spacing="xs">
							<IconDownload />
							<Text>
								Downloads:{' '}
								{downloadCount
									? millify(downloadCount, { precision: 2 })
									: 'N/A'}
							</Text>
						</Group>
						<Group spacing="xs">
							<IconEdit />
							<Text>Last Modified: {metadata.lastModified}</Text>
						</Group>
						<Group spacing="xs">
							<IconVersion />
							<Text>Version: {metadata.version}</Text>
						</Group>
						<Text>&copy; {replaceAttribution}</Text>
						<Group position="apart" grow>
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
			</Grid.Col>
		</Grid>
	);
};
