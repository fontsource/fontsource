interface Env {
	METADATA: KVNamespace;
	STATS: KVNamespace;
	BUCKET: R2Bucket;

	// Secrets
	UPLOAD_KEY: string;
}
