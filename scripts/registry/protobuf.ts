import { readFileSync } from 'node:fs';
import protobuf, { type Type } from 'protobufjs';
import textformat from 'protobufjs/ext/textformat.js';

export const loadProtoType = (path: string, name: string): Type =>
	protobuf
		.parse(readFileSync(new URL(path, import.meta.url), 'utf8'), {
			keepCase: true,
		})
		.root.lookupType(name);

export const parseProto = <Value>(type: Type, source: string): Value =>
	textformat.fromText(type, source) as unknown as Value;
