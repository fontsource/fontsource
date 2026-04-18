import { z } from 'zod';

const builderStartupEnvSchema = z.object({
	R2_S3_ENDPOINT: z.string(),
	FONTS_BUCKET_NAME: z.string(),
	R2_ACCESS_KEY_ID: z.string(),
	R2_SECRET_ACCESS_KEY: z.string(),
});

const workerBindingSchema = z.object({
	METADATA: z.unknown(),
	FONTS: z.unknown(),
	ARTIFACT_BUILDER: z.unknown(),
});

export type BuilderStartupEnv = z.infer<typeof builderStartupEnvSchema>;

export type AppEnv = {
	Bindings: Env;
};

export const parseEnv = (env: Env): void => {
	workerBindingSchema.parse(env);
};

/**
 * The container only needs the direct R2 upload settings. Keep that selection in
 * one place so the Worker/container bridge does not hand-roll the same object.
 */
export const getBuilderStartupEnv = (env: Env): BuilderStartupEnv =>
	builderStartupEnvSchema.parse(env);
