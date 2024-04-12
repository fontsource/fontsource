interface Env {
	METADATA: KVNamespace;
	VERSIONS: KVNamespace;
	BUCKET: R2Bucket;

	// Secrets
	UPLOAD_KEY: string;
}
