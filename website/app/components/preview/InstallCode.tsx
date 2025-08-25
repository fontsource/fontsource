import { generateFontFace, type FontObject } from '@fontsource-utils/generate';
import { Badge, Divider, Group, Tabs, Text, Title } from '@mantine/core';
import { Link } from 'react-router';
import { useState } from 'react';

import { Blockquote } from '@/components/Blockquote';
import { Code } from '@/components/code/Code';
import type { Metadata, VariableData } from '@/utils/types';

import classes from './InstallCode.module.css';

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

	// Remove ital from active axes and mark separate ital flag as true
	const activeAxes = Object.keys(isActive).filter((axis) => axis !== 'ital');
	const isItal = isActive.ital;

	// Determine if it is a standard axis e.g. only contains wght, wdth, slnt, opsz or ital
	const isStandard = activeAxes.every((axis) =>
		['wght', 'wdth', 'slnt', 'opsz'].includes(axis),
	);

	const importComment =
		metadata.weights.length === 1
			? `// Supports only weight ${metadata.weights[0]}\n`
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
	if (!variable) return;

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
		setActive((prev) => {
			if (prev.axes[value]) {
				delete prev.axes[value];
				return {
					...prev,
					axes: {
						...prev.axes,
						wght: true,
					},
				};
			}

			return {
				...prev,
				axes: {
					...prev.axes,
					[value]: true,
					wght: true,
				},
			};
		});
	};

	// Remove ital from active axes and mark separate ital flag as true
	const activeAxes = Object.keys(isActive.axes).filter(
		(axis) => axis !== 'ital',
	);
	const isItal = isActive.axes.ital;

	// Determine if it is a standard axis e.g. only contains wght, wdth, slnt, opsz or ital
	const isStandard = activeAxes.every((axis) =>
		['wght', 'wdth', 'slnt', 'opsz'].includes(axis),
	);

	// Choose which axes file to serve based on active axes
	const getFileAxes = (): string => {
		if (activeAxes.length === 1 && isActive.axes.wght) {
			if (isItal) return 'wght-italic';
			return 'wght-normal';
		}

		// If it is only wght and another axes, return axes.woff2
		if (activeAxes.length === 2 && isActive.axes.wght) {
			const selected =
				activeAxes.find((axis) => axis !== 'wght')?.toLowerCase() ?? 'wght';
			if (isItal) return `${selected}-italic`;
			return `${selected}-normal`;
		}

		// If the selected axes is within standard, only return standard
		if (isStandard) {
			if (isItal) return 'standard-italic';
			return 'standard-normal';
		}

		// If the selected axes is not within standard, return full
		if (isItal) return 'full-italic';
		return 'full-normal';
	};
	const fileAxes = getFileAxes();

	// Generate CSS
	const css: string[] = [];
	for (const subset of isActive.subsets) {
		const url = `@fontsource-variable/${metadata.id}/files/${metadata.id}-${subset}-${fileAxes}.woff2`;

		const fontObj: FontObject = {
			family: `${metadata.family} Variable`,
			display: isActive.display,
			style: isItal ? 'italic' : 'normal',
			weight: 400,
			src: [
				{
					url,
					format: 'woff2-variations',
				},
			],
			variable: {
				wght: isActive.axes.wght ? variable.axes.wght : undefined,
				stretch: isActive.axes.wdth ? variable.axes.wdth : undefined,
				slnt: isActive.axes.slnt ? variable.axes.slnt : undefined,
			},
			unicodeRange: metadata.unicodeRange[subset],
			comment: `${metadata.id}-${subset}-wght-${isItal ? 'italic' : 'normal'}`,
		};

		css.push(generateFontFace(fontObj));
	}

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
			<Code language="css">{css.join('\n\n')}</Code>
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
		setActiveWeight((prev) => {
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
	const FORMATS = ['woff2', 'woff'];
	const [formats, setFormat] = useState(['woff2', 'woff']);
	const handleFormat = (value: string) => {
		if (formats.length === 1 && formats.includes(value)) return;

		setFormat((prev) => {
			if (prev.includes(value)) {
				return prev.filter((item) => item !== value);
			}

			return [...prev, value];
		});
	};

	// Generate CSS
	const css: string[] = [];
	for (const subset of subsets) {
		for (const weight of Object.keys(isActiveWeight)) {
			const url = `@fontsource/${metadata.id}/files/${
				metadata.id
			}-${subset}-${weight}-${isItal ? 'italic' : 'normal'}`;

			const src = formats.map((format) => ({
				url: `${url}.${format}`,
				format,
			}));

			const fontObj: FontObject = {
				family: metadata.family,
				display: displayCurrent,
				style: isItal ? 'italic' : 'normal',
				weight: Number(weight),
				src,
				unicodeRange: metadata.unicodeRange[subset],
				comment: `${metadata.id}-${subset}-${weight}-${
					isItal ? 'italic' : 'normal'
				}`,
			};

			css.push(generateFontFace(fontObj));
		}
	}

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
				items={FORMATS}
				onClick={handleFormat}
				isActive={(value) => formats.includes(value)}
			/>
			<Divider mt="xl" />
			<Title order={3} mt="lg" mb="md">
				Copy CSS
			</Title>
			<Text>
				Import this into your global CSS file. Your bundler will automatically
				rewrite the URL into a useable asset:
			</Text>
			<Code language="css">{css.join('\n\n')}</Code>
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
						<Link to="/docs/getting-started/material-icons">
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
						<Link to="/docs/getting-started/material-symbols">
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
