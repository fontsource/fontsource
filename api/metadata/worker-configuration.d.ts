interface Env {
	FONTLIST: KVNamespace;
	FONTS: KVNamespace;
	VARIABLE: KVNamespace;
	VARIABLE_LIST: KVNamespace;
	STATS: KVNamespace;

	BUCKET: R2Bucket;

	// Secrets
	UPLOAD_KEY: string;
}
