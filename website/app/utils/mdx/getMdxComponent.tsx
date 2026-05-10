import {
	type BlockquoteProps,
	type BoxProps,
	type CodeProps,
	Divider,
	type DividerProps,
	List,
	type ListItemProps,
	type ListProps,
	Table,
	type TableProps,
	type TableTbodyProps,
	type TableTdProps,
	type TableTfootProps,
	type TableTheadProps,
	type TableThProps,
	type TableTrProps,
	Text,
	type TextProps,
	Title,
	type TitleProps,
} from '@mantine/core';
import cx from 'clsx';
import { Link } from 'react-router';

import { Blockquote } from '@/components/Blockquote';
import { CodeMdx } from '@/components/code/Code';
import { PackageManagerCode } from '@/components/code/PackageManagerCode';
import docsMdxClasses from '@/components/docs/Mdx.module.css';

const mdxComponents = {
	// Typography
	h1: () => null,
	h2: (props: BoxProps) => (
		<Title order={2} fw={700} fz={24} lh={1.25} mt={42} mb="sm" {...props} />
	),
	h3: (props: TitleProps) => (
		<Title order={3} fw={700} fz={19} lh={1.35} mt="xl" mb="sm" {...props} />
	),
	h4: (props: TitleProps) => (
		<Title order={4} fw={700} fz={17} lh={1.4} mt="lg" mb="xs" {...props} />
	),
	p: (props: TextProps) => (
		<Text fw={400} fz={16} lh={1.75} my="md" {...props} />
	),

	// Lists
	ol: (props: ListProps) => <List type="ordered" {...props} />,
	ul: (props: ListProps) => <List {...props} />,
	li: (props: ListItemProps) => <List.Item fz={16} {...props} />,

	// Code
	pre: (props: React.HTMLAttributes<HTMLDivElement>) => <div {...props} />, // Unnecessary pre as we use Code component
	code: (props: CodeProps) => <CodeMdx {...props} />,

	// Table
	table: (props: TableProps) => <Table fz="sm" {...props} />,
	thead: (props: TableTheadProps) => <Table.Thead {...props} />,
	tbody: (props: TableTbodyProps) => <Table.Tbody {...props} />,
	tr: (props: TableTrProps) => <Table.Tr {...props} />,
	th: (props: TableThProps) => <Table.Th {...props} />,
	td: (props: TableTdProps) => <Table.Td {...props} />,
	caption: (props: React.ComponentProps<'caption'>) => <caption {...props} />,
	tfoot: (props: TableTfootProps) => <Table.Tfoot {...props} />,

	// Other
	hr: (props: DividerProps) => <Divider mb="md" {...props} />,
	blockquote: (props: BlockquoteProps) => <Blockquote fz={16} {...props} />,
	a: ({
		href = '',
		children,
		className,
		...props
	}: React.ComponentProps<'a'>) => {
		if (href.startsWith('/') || href.startsWith('#')) {
			return (
				<Link
					to={href}
					className={cx(docsMdxClasses.link, className)}
					{...props}
				>
					{children}
				</Link>
			);
		}

		const externalProps = href.startsWith('http')
			? { target: '_blank', rel: 'noreferrer' }
			: {};

		return (
			<a
				href={href}
				className={cx(docsMdxClasses.link, className)}
				{...externalProps}
				{...props}
			>
				{children}
			</a>
		);
	},
	PackageManagerCode,
};

export { mdxComponents };
