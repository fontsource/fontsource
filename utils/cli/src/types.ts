export interface CLIOptions {
	test?: boolean;
	out?: string;
}

export interface BuildOptions {
	dir: string;
	tmpDir: string;
	force: boolean;
}
