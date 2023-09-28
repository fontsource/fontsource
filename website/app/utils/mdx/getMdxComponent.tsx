/* eslint-disable unicorn/prefer-module */
import { Divider, List, rem, Table, Text, Title } from '@mantine/core';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { Blockquote } from '@/components/Blockquote';
import { CodeMdx } from '@/components/code/Code';
import { PackageManagerCode } from '@/components/code/PackageManagerCode';

// eslint-disable-next-line @typescript-eslint/naming-convention
const _jsx_runtime =
	process.env.NODE_ENV === 'development'
		? require('react/jsx-dev-runtime')
		: require('react/jsx-runtime');

const mdxComponents = {
	// Typography
	h1: (props: any) => (
		<Title
			order={1}
			fw={700}
			size={28}
			mt="sm"
			mb="xs"
			sx={{ lineHeight: rem(50) }}
			{...props}
		/>
	),
	h2: (props: any) => (
		<Title
			order={2}
			fw={700}
			size={24}
			mt="sm"
			mb="xs"
			sx={{ lineHeight: rem(50) }}
			{...props}
		/>
	),
	h3: (props: any) => (
		<Title
			order={3}
			fw={700}
			size={18}
			mt="sm"
			mb="xs"
			sx={{ lineHeight: rem(40) }}
			{...props}
		/>
	),
	h4: (props: any) => (
		<Title
			order={4}
			fw={700}
			size={16}
			mt="sm"
			mb="xs"
			sx={{ lineHeight: rem(40) }}
			{...props}
		/>
	),
	p: (props: any) => (
		<Text fw={400} size={15} sx={{ lineHeight: rem(24) }} {...props} />
	),

	// Lists
	ul: (props: any) => <List {...props} />,
	li: (props: any) => <List.Item {...props} />,

	// Code
	pre: (props: any) => <div {...props} />, // Unnecessary pre as we use Code component
	code: (props: any) => <CodeMdx {...props} />,

	// Table
	table: (props: any) => <Table fontSize="sm" {...props} />,

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
