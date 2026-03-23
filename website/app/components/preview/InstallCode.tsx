import { Badge, Divider, Group, Tabs, Text, Title } from '@mantine/core';
import { useState } from 'react';
import { Link } from 'react-router';

import { Blockquote } from '@/components/Blockquote';
import { Code } from '@/components/code/Code';
import type { Metadata, VariableData } from '@/utils/types';
import {
	buildStaticPreviewCSS,
	buildVariablePreviewCSS,
	getVariableImport,
} from './font-styles';
import classes from './InstallCode.module.css';
import { toggleActiveKeyKeepingOne, toggleVariableAxis } from './toggles';

const categoryMap: Record<string, string> = {
	'sans-serif': 'sans-serif',
	serif: 'serif',
	monospace: 'monospace',
	handwriting: 'cursive',
	display: 'system-ui',
};

interface BadgeGroupProps {
	items: string[];
	onClick: (value: string) => void;
	isActive: (value: string) => boolean;
	mt?: string;
}

interface ActiveVariants {
	axes: Record<string, boolean>;
	display: string;
	subsets: string[];
	ital?: boolean;
}

interface InstallCodeProps {
	metadata: Metadata;
	variable?: VariableData;
}

// Accepted display values
const DISPLAYS = ['auto', 'swap', 'block', 'fallback', 'optional'];

const BadgeGroup = ({ items, onClick, isActive, mt }: BadgeGroupProps) => (
	<Group mt={mt}>
		{items.map((item) => (
			<Badge
				key={item}
				className={classes.badge}
				onClick={() => {
					onClick(item);
				}}
				data-active={Boolean(isActive(item))}
			>
				{item}
			</Badge>
		))}
	</Group>
);

const VariableSimple = ({ metadata, variable }: InstallCodeProps) => {
	const [isActive, setActive] = useState<Record<string, boolean>>({
		wght: true,
	});

	if (!variable) return null;

	const isItal = isActive.ital;

	const importComment =
		metadata.weights.length === 1
			? `// Supports only weight ${metadata.weights[0]}\n`
			: `// Supports weights ${metadata.weights[0]}-${
					metadata.weights.at(-1) ?? 400
				}\n`;

	const generateImports = () => {
		const activeAxisTags = Object.keys(isActive).filter(
			(axis) => isActive[axis],
		);
		const importSpecifier = getVariableImport(
			metadata,
			variable,
			activeAxisTags,
			isItal ? 'italic' : 'normal',
		);
		return `import '${importSpecifier}';`;
	};

	const handleActive = (value: string | number) => {
		setActive((prev) => toggleVariableAxis(prev, value));
	};

	return (
		<>
			{variable && (
				<BadgeGroup
					items={Object.keys(variable.axes)}
					onClick={handleActive}
					isActive={(value) => isActive[value]}
					mt="xs"
				/>
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
  font-family: '${metadata.family} Variable', ${
		categoryMap[metadata.category] ?? 'sans-serif'
	};
}`}
			</Code>
		</>
	);
};

const VariableAdvanced = ({ metadata, variable }: InstallCodeProps) => {
	const [isActive, setActive] = useState<ActiveVariants>({
		axes: {
			wght: true,
		},
		display: 'swap',
		subsets: [metadata.defSubset],
	});

	// Return early if no variable data
	if (!variable) return null;

	const handleActiveSubset = (value: string) => {
		// Return early if only one subset is selected and it is the current one
		if (isActive.subsets.length === 1 && isActive.subsets.includes(value))
			return;

		setActive((prev) => {
			if (prev.subsets.includes(value)) {
				return {
					...prev,
					subsets: prev.subsets.filter((subset) => subset !== value),
				};
			}

			return {
				...prev,
				subsets: [...prev.subsets, value],
			};
		});
	};

	const handleActiveDisplay = (value: string) => {
		setActive((prev) => ({
			...prev,
			display: value,
		}));
	};

	const handleActiveVariant = (value: string | number) => {
		setActive((prev) => ({
			...prev,
			axes: toggleVariableAxis(prev.axes, value),
		}));
	};

	const isItal = isActive.axes.ital;

	const css = buildVariablePreviewCSS(metadata, variable, {
		activeAxes: Object.keys(isActive.axes).filter(
			(axis) => isActive.axes[axis],
		),
		subsets: isActive.subsets,
		style: isItal ? 'italic' : 'normal',
		display: isActive.display,
		resolver: ({ source }) =>
			`@fontsource-variable/${metadata.id}/files/${source.filename}`,
	});

	return (
		<>
			<Title order={3} mt="xl" mb="md">
				Subsets
			</Title>
			<BadgeGroup
				items={metadata.subsets}
				onClick={handleActiveSubset}
				isActive={(value) => isActive.subsets.includes(value)}
			/>
			<Divider mt="xl" />
			<Title order={3} mt="lg" mb="md">
				Variants
			</Title>
			<BadgeGroup
				items={Object.keys(variable.axes)}
				onClick={handleActiveVariant}
				isActive={(value) => isActive.axes[value]}
			/>
			<Divider mt="xl" />
			<Title order={3} mt="lg" mb="md">
				Display
			</Title>
			<BadgeGroup
				items={DISPLAYS}
				onClick={handleActiveDisplay}
				isActive={(value) => isActive.display === value}
			/>
			<Divider mt="xl" />
			<Title order={3} mt="lg" mb="md">
				Copy CSS
			</Title>
			<Text>
				Import this into your global CSS file. Your bundler will automatically
				rewrite the URL into a useable asset:
			</Text>
			<Code language="css">{css}</Code>
			<Text>Then include the following CSS in your project:</Text>
			<Code language="css">{`body {
  font-family: '${metadata.family} Variable', ${
		categoryMap[metadata.category] ?? 'sans-serif'
	};
}`}</Code>
		</>
	);
};

const StaticSimple = ({ metadata }: InstallCodeProps) => {
	const [isActive, setActive] = useState<Record<string, boolean>>({
		400: true,
	});
	const keys = Object.keys(isActive);
	const handleActive = (value: string | number) => {
		setActive((prev) => toggleActiveKeyKeepingOne(prev, value));
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
			<Group>
				{metadata.weights.map((weight) => (
					<Badge
						key={weight}
						className={classes.badge}
						onClick={() => {
							handleActive(weight);
						}}
						data-active={Boolean(isActive[weight])}
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
						data-active={isItal}
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
  font-family: '${metadata.family}', ${
		categoryMap[metadata.category] ?? 'sans-serif'
	};
}`}
			</Code>
		</>
	);
};

const StaticAdvanced = ({ metadata }: InstallCodeProps) => {
	// Active weights
	const [isActiveWeight, setActiveWeight] = useState<Record<string, boolean>>({
		400: true,
	});
	const keys = Object.keys(isActiveWeight);
	const handleActiveWeight = (value: string | number) => {
		setActiveWeight((prev) => toggleActiveKeyKeepingOne(prev, value));
	};

	// Active italics
	const [isItal, setIsItal] = useState(false);

	// Displays
	const [displayCurrent, setDisplay] = useState('swap');
	const handleDisplay = (value: string) => {
		setDisplay(value);
	};

	// Active subsets
	const [subsets, setSubsets] = useState<string[]>([metadata.defSubset]);
	const handleActiveSubset = (value: string) => {
		if (subsets.length === 1 && subsets.includes(value)) return;

		setSubsets((prev) => {
			if (prev.includes(value)) {
				return prev.filter((subset) => subset !== value);
			}

			return [...prev, value];
		});
	};

	// Choose formats
	const FORMATS = ['woff2', 'woff'] as const;
	const [formats, setFormat] = useState<(typeof FORMATS)[number][]>([
		'woff2',
		'woff',
	]);
	const handleFormat = (value: string) => {
		if (!FORMATS.includes(value as (typeof FORMATS)[number])) return;
		const selectedFormat = value as (typeof FORMATS)[number];

		if (formats.length === 1 && formats.includes(selectedFormat)) return;

		setFormat((prev) => {
			if (prev.includes(selectedFormat)) {
				return prev.filter((item) => item !== selectedFormat);
			}

			return [...prev, selectedFormat];
		});
	};

	const css = buildStaticPreviewCSS(metadata, {
		subsets,
		weights: Object.keys(isActiveWeight).map((weight) => Number(weight)),
		style: isItal ? 'italic' : 'normal',
		formats,
		display: displayCurrent,
		resolver: ({ source }) =>
			`@fontsource/${metadata.id}/files/${source.filename}`,
	});

	return (
		<>
			<Title order={3} mt="xl" mb="md">
				Subsets
			</Title>
			<BadgeGroup
				items={metadata.subsets}
				onClick={handleActiveSubset}
				isActive={(value) => subsets.includes(value)}
			/>
			<Divider mt="xl" />
			<Title order={3} mt="lg" mb="md">
				Weights
			</Title>
			<Group>
				{metadata.weights.map((weight) => (
					<Badge
						key={weight}
						className={classes.badge}
						onClick={() => {
							handleActiveWeight(weight);
						}}
						data-active={isActiveWeight[weight]}
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
						data-active={isItal}
					>
						italic
					</Badge>
				)}
			</Group>
			<Divider mt="xl" />
			<Title order={3} mt="lg" mb="md">
				Display
			</Title>
			<BadgeGroup
				items={DISPLAYS}
				onClick={handleDisplay}
				isActive={(value) => displayCurrent === value}
			/>
			<Divider mt="xl" />
			<Title order={3} mt="lg" mb="md">
				Formats
			</Title>
			<BadgeGroup
				items={Array.from(FORMATS)}
				onClick={handleFormat}
				isActive={(value) =>
					formats.includes(value as (typeof FORMATS)[number])
				}
			/>
			<Divider mt="xl" />
			<Title order={3} mt="lg" mb="md">
				Copy CSS
			</Title>
			<Text>
				Import this into your global CSS file. Your bundler will automatically
				rewrite the URL into a useable asset:
			</Text>
			<Code language="css">{css}</Code>
			<Text>Then include the following CSS in your project:</Text>
			<Code language="css">{`body {
  font-family: '${metadata.family}', ${
		categoryMap[metadata.category] ?? 'sans-serif'
	};
}`}</Code>
		</>
	);
};

export const InstallCode = ({ metadata, variable }: InstallCodeProps) => {
	const isMaterialIcons = metadata.id.includes('material-icons');
	const isMaterialSymbols = metadata.id.includes('material-symbols');
	return (
		<Tabs defaultValue="simple" className={classes.wrapper}>
			<Tabs.List>
				<Tabs.Tab value="simple">Simple</Tabs.Tab>
				<Tabs.Tab value="advanced">Advanced</Tabs.Tab>
			</Tabs.List>
			<Tabs.Panel value="simple" pt="md">
				<Title order={3} mt="xs" mb="md">
					Import
				</Title>
				<Text mb="md">
					Include the following line in the root layout of your project to
					import the font:
				</Text>
				{variable ? (
					<VariableSimple metadata={metadata} variable={variable} />
				) : (
					<StaticSimple metadata={metadata} />
				)}
				{isMaterialIcons && (
					// @ts-expect-error - BoxProps technically does take in children props
					<Blockquote>
						<b>Note:</b>Using Material Icons on your website with Fontsource
						requires additional steps. Please refer to the{' '}
						<Link to="/docs/getting-started/material-icons" prefetch="intent">
							Material Icons documentation
						</Link>{' '}
						for more information.
					</Blockquote>
				)}
				{isMaterialSymbols && (
					// @ts-expect-error - BoxProps technically does take in children props
					<Blockquote>
						<b>Note:</b>Using Material Symbols on your website with Fontsource
						requires additional steps. Please refer to the{' '}
						<Link to="/docs/getting-started/material-symbols" prefetch="intent">
							Material Symbols documentation
						</Link>{' '}
						for more information.
					</Blockquote>
				)}
			</Tabs.Panel>
			<Tabs.Panel value="advanced" pt="xs">
				{/* @ts-expect-error - BoxProps technically does take in children props	*/}
				<Blockquote>
					<b>Note:</b> Advanced usage is recommended for users who explicitly
					need to control their <code>@font-face</code> declarations and is only
					compatible with <b>Vite</b>-based frameworks or similar.
				</Blockquote>
				{variable ? (
					<VariableAdvanced metadata={metadata} variable={variable} />
				) : (
					<StaticAdvanced metadata={metadata} />
				)}
			</Tabs.Panel>
		</Tabs>
	);
};
