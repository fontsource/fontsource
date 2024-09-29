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
	type TableThProps,
	type TableTheadProps,
	type TableTrProps,
	Text,
	type TextProps,
	Title,
	type TitleProps,
} from '@mantine/core';

import { Blockquote } from '@/components/Blockquote';
import { CodeMdx } from '@/components/code/Code';
import { PackageManagerCode } from '@/components/code/PackageManagerCode';
import type { ComponentType } from 'react';

const nativeComponentMap = {
	blockquote: (props: React.HTMLAttributes<HTMLElement>) => (
		<blockquote {...props} />
	),
	strong: (props: React.HTMLAttributes<HTMLElement>) => <strong {...props} />,
	em: (props: React.HTMLAttributes<HTMLElement>) => <em {...props} />,
	del: (props: React.HTMLAttributes<HTMLElement>) => <del {...props} />,
	hr: (props: React.HTMLAttributes<HTMLHRElement>) => <hr {...props} />,
	a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} />,
	b: (props: React.HTMLAttributes<HTMLElement>) => <b {...props} />,
	br: (props: React.HTMLAttributes<HTMLElement>) => <br {...props} />,
	button: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
		<button {...props} />
	),
	div: (props: React.HTMLAttributes<HTMLDivElement>) => <div {...props} />,
	form: (props: React.FormHTMLAttributes<HTMLFormElement>) => (
		<form {...props} />
	),
	h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => <h1 {...props} />,
	h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => <h2 {...props} />,
	h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => <h3 {...props} />,
	h4: (props: React.HTMLAttributes<HTMLHeadingElement>) => <h4 {...props} />,
	head: (props: React.HTMLAttributes<HTMLElement>) => <head {...props} />,
	iframe: (props: React.IframeHTMLAttributes<HTMLIFrameElement>) => (
		<iframe {...props} />
	),
	// biome-ignore lint/a11y/useAltText: <explanation>
	img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
	input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
		<input {...props} />
	),
	label: (props: React.LabelHTMLAttributes<HTMLLabelElement>) => (
		// biome-ignore lint/a11y/noLabelWithoutControl: <explanation>
		<label {...props} />
	),
	li: (props: React.LiHTMLAttributes<HTMLLIElement>) => <li {...props} />,
	link: (props: React.LinkHTMLAttributes<HTMLLinkElement>) => (
		<link {...props} />
	),
	ol: (props: React.OlHTMLAttributes<HTMLOListElement>) => <ol {...props} />,
	p: (props: React.HTMLAttributes<HTMLParagraphElement>) => <p {...props} />,
	path: (props: React.SVGAttributes<SVGPathElement>) => <path {...props} />,
	picture: (props: React.HTMLAttributes<HTMLElement>) => <picture {...props} />,
	script: (props: React.ScriptHTMLAttributes<HTMLScriptElement>) => (
		<script {...props} />
	),
	section: (props: React.HTMLAttributes<HTMLElement>) => <section {...props} />,
	source: (props: React.SourceHTMLAttributes<HTMLSourceElement>) => (
		<source {...props} />
	),
	span: (props: React.HTMLAttributes<HTMLSpanElement>) => <span {...props} />,
	sub: (props: React.HTMLAttributes<HTMLElement>) => <sub {...props} />,
	sup: (props: React.HTMLAttributes<HTMLElement>) => <sup {...props} />,
	svg: (props: React.SVGAttributes<SVGSVGElement>) => <svg {...props} />,
	table: (props: React.TableHTMLAttributes<HTMLTableElement>) => (
		<table {...props} />
	),
	tbody: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
		<tbody {...props} />
	),
	td: (props: React.TdHTMLAttributes<HTMLTableDataCellElement>) => (
		<td {...props} />
	),
	tfoot: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
		<tfoot {...props} />
	),
	th: (props: React.ThHTMLAttributes<HTMLTableHeaderCellElement>) => (
		<th {...props} />
	),
	thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
		<thead {...props} />
	),
	tr: (props: React.HTMLAttributes<HTMLTableRowElement>) => <tr {...props} />,
	ul: (props: React.HTMLAttributes<HTMLUListElement>) => <ul {...props} />,
	video: (props: React.VideoHTMLAttributes<HTMLVideoElement>) => (
		<video {...props} />
	),
	code: (props: React.HTMLAttributes<HTMLElement>) => <code {...props} />,
	pre: (props: React.HTMLAttributes<HTMLPreElement>) => <pre {...props} />,
};

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
	p: (props: TextProps) => <Text fw={400} fz={15} {...props} />,

	// Lists
	ul: (props: ListProps) => <List {...props} />,
	li: (props: ListItemProps) => <List.Item mt="md" {...props} />,

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
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	PackageManagerCode: (props: any) => <PackageManagerCode {...props} />,
};

export { nativeComponentMap, mdxComponents };
