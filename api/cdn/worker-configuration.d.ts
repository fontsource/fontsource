interface Env {
	CSS: KVNamespace;
	FONTS: R2Bucket;
	METADATA: Fetcher;

	// Secrets
	UPLOAD_KEY: string;
}
