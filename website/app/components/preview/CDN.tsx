import { type FontObject, generateFontFace } from '@fontsource-utils/generate';
import {
	Badge,
	Divider,
	Grid,
	Group,
	Tabs,
	Text,
	Title,
	UnstyledButton,
} from '@mantine/core';
import { useState } from 'react';
import { Link } from 'react-router';

import { Code } from '@/components/code/Code';
import { IconExternal } from '@/components/icons';
import globalClasses from '@/styles/global.module.css';
import type { Metadata, VariableData } from '@/utils/types';

import { CarbonAd } from '../CarbonAd';
import classes from './CDN.module.css';
import { InfoWrapper } from './Info';

interface CDNProps {
	metadata: Metadata;
	variable?: VariableData;
	hits?: number;
}

interface BadgeGroupProps {
	items: string[];
	onClick: (value: string) => void;
	isActive: (value: string) => boolean;
}

interface ActiveVariants {
	axes: Record<string, boolean>;
	display: string;
	subsets: string[];
	ital?: boolean;
}

// Accepted display values
const DISPLAYS = ['auto', 'swap', 'block', 'fallback', 'optional'];

const BadgeGroup = ({ items, onClick, isActive }: BadgeGroupProps) => (
	<Group>
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

const Variable = ({ metadata, variable }: CDNProps) => {
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
		const url = `https://cdn.jsdelivr.net/fontsource/fonts/${metadata.id}:vf@latest/${subset}-${fileAxes}.woff2`;

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
			comment: `${metadata.id}-${subset}-wght-normal`,
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
			<Text>Import this into your global CSS file:</Text>
			<Code language="css">{css.join('\n\n')}</Code>
		</>
	);
};

const Static = ({ metadata }: CDNProps) => {
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
	const FORMATS = ['woff2', 'woff', 'ttf'];
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
			const url = `https://cdn.jsdelivr.net/fontsource/fonts/${
				metadata.id
			}@latest/${subset}-${weight}-${isItal ? 'italic' : 'normal'}`;

			const src = formats.map((format) => ({
				url: `${url}.${format}`,
				format: format === 'ttf' ? 'truetype' : format,
			}));

			const fontObj: FontObject = {
				family: metadata.family,
				display: displayCurrent,
				style: isItal ? 'italic' : 'normal',
				weight: Number(weight),
				src,
				unicodeRange: metadata.unicodeRange[subset],
				comment: `${metadata.id}-${subset}-${weight}${
					isItal ? '-italic' : '-normal'
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
			<Text>Import this into your global CSS file:</Text>
			<Code language="css">{css.join('\n\n')}</Code>
		</>
	);
};

export const CDN = ({ metadata, variable, hits }: CDNProps) => {
	return (
		<Grid className={globalClasses.container}>
			<Grid.Col span={{ base: 12, md: 8 }}>
				<Group justify="space-between" mb={28}>
					<Title>CDN</Title>
					<UnstyledButton
						component={Link}
						className={classes.button}
						to="/docs/getting-started/cdn"
						prefetch="intent"
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
				<InfoWrapper metadata={metadata} hits={hits} isCDN />
				<CarbonAd w={332} />
			</Grid.Col>
		</Grid>
	);
};
