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
	type TableCaptionProps,
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

import { Blockquote } from '@/components/Blockquote';
import { CodeMdx } from '@/components/code/Code';
import { PackageManagerCode } from '@/components/code/PackageManagerCode';

const mdxComponents = {
	// Typography
	h1: (props: BoxProps) => (
		<>
			<Title order={1} fw={700} fz={28} mt="lg" mb="sm" {...props} />
			<Divider mb="sm" {...props} />
		</>
	),
	h2: (props: BoxProps) => (
		<>
			<Title order={2} fw={700} fz={22} mt="lg" mb="sm" {...props} />
			<Divider mb="sm" {...props} />
		</>
	),
	h3: (props: TitleProps) => (
		<Title order={3} fw={700} fz={16} mt="lg" mb="sm" {...props} />
	),
	h4: (props: TitleProps) => (
		<Title order={4} fw={700} fz={15} mt="lg" mb="sm" {...props} />
	),
	p: (props: TextProps) => <Text fw={400} fz={15} my="md" {...props} />,

	// Lists
	ol: (props: ListProps) => <List type="ordered" {...props} />,
	ul: (props: ListProps) => <List {...props} />,
	li: (props: ListItemProps) => <List.Item {...props} />,

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
	caption: (props: TableCaptionProps) => <Table.Caption {...props} />,
	tfoot: (props: TableTfootProps) => <Table.Tfoot {...props} />,

	// Other
	hr: (props: DividerProps) => <Divider mb="md" {...props} />,
	blockquote: (props: BlockquoteProps) => <Blockquote {...props} />,
	// biome-ignore lint/suspicious/noExplicitAny: Selective.
	PackageManagerCode: (props: any) => <PackageManagerCode {...props} />,
};

export { mdxComponents };
