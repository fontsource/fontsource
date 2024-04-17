import { Divider, List, Table, Text, Title } from '@mantine/core';
import * as React from 'react';
import * as _jsx_runtime from 'react/jsx-runtime';
import * as ReactDOM from 'react-dom';

import { Blockquote } from '@/components/Blockquote';
import { CodeMdx } from '@/components/code/Code';
import { PackageManagerCode } from '@/components/code/PackageManagerCode';

const mdxComponents = {
	// Typography
	h1: (props: any) => (
		<>
			<Title order={1} fw={700} fz={28} mt="lg" mb="sm" {...props} />
			<Divider mb="sm" {...props} />
		</>
	),
	h2: (props: any) => (
		<>
			<Title order={2} fw={700} fz={22} mt="lg" mb="sm" {...props} />
			<Divider mb="sm" {...props} />
		</>
	),
	h3: (props: any) => (
		<Title order={3} fw={700} fz={16} mt="lg" mb="sm" {...props} />
	),
	h4: (props: any) => (
		<Title order={4} fw={700} fz={15} mt="lg" mb="sm" {...props} />
	),
	p: (props: any) => <Text fw={400} fz={15} {...props} />,

	// Lists
	ul: (props: any) => <List {...props} />,
	li: (props: any) => <List.Item mt="md" {...props} />,

	// Code
	pre: (props: any) => <div {...props} />, // Unnecessary pre as we use Code component
	code: (props: any) => <CodeMdx {...props} />,

	// Table
	table: (props: any) => <Table fz="sm" {...props} />,
	thead: (props: any) => <Table.Thead {...props} />,
	tbody: (props: any) => <Table.Tbody {...props} />,
	tr: (props: any) => <Table.Tr {...props} />,
	th: (props: any) => <Table.Th {...props} />,
	td: (props: any) => <Table.Td {...props} />,
	caption: (props: any) => <Table.Caption {...props} />,
	tfoot: (props: any) => <Table.Tfoot {...props} />,

	// Other
	hr: (props: any) => <Divider mb="md" {...props} />,
	blockquote: (props: any) => <Blockquote {...props} />,
	PackageManagerCode: (props: any) => <PackageManagerCode {...props} />,
};

const getMDXExport = (code: string, globals?: Record<string, string>) => {
	const scope = { React, ReactDOM, _jsx_runtime, ...globals };

	// eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
	const fn = new Function(...Object.keys(scope), code);
	return fn(...Object.values(scope));
};

const getMDXComponent = (code: string, globals?: Record<string, string>) => {
	const mdxExport = getMDXExport(code, globals);
	return mdxExport.default;
};

export { getMDXComponent, getMDXExport, mdxComponents };
