import { rem,Text, Title } from '@mantine/core';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

let _jsx_runtime: any;
if (process.env.NODE_ENV === 'development') {
	_jsx_runtime = require('react/jsx-dev-runtime');
} else {
	_jsx_runtime = require('react/jsx-runtime');
}

const mdxComponents = {
	h1: (props: any) => <Title fw={700} size={24} sx={{ lineHeight: rem(50) }} {...props} />,
	h2: (props: any) => <Title fw={700} size={18} sx={{ lineHeight: rem(40) }} {...props} />,
	p: (props: any) => <Text fw={400} size={15} sx={{lineHeight: rem(24)}}{...props} />,
};

const getMDXComponent = (code: string, globals?: Record<string, string>) => {
	const mdxExport = getMDXExport(code, globals);
	return mdxExport.default;
};

const getMDXExport = (code: string, globals?: Record<string, string>) => {
	const scope = { React, ReactDOM, _jsx_runtime, ...globals };
	// eslint-disable-next-line
	const fn = new Function(...Object.keys(scope), code);
	return fn(...Object.values(scope));
};

export { getMDXComponent, getMDXExport, mdxComponents };
