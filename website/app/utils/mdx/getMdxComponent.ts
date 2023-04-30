import * as React from 'react';
import * as ReactDOM from 'react-dom';

let _jsx_runtime: any;
if (process.env.NODE_ENV === 'development') {
	_jsx_runtime = require('react/jsx-dev-runtime');
} else {
	_jsx_runtime = require('react/jsx-runtime');
}

type Globals = Record<string, unknown>;

function getMDXComponent(code: string, globals?: Globals) {
	const mdxExport = getMDXExport(code, globals);
	return mdxExport.default;
}

function getMDXExport(code: string, globals?: Globals) {
	const scope = { React, ReactDOM, _jsx_runtime, ...globals };
	// eslint-disable-next-line
	const fn = new Function(...Object.keys(scope), code);
	return fn(...Object.values(scope));
}

export { getMDXComponent, getMDXExport };
