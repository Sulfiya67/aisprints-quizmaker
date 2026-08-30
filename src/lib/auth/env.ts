import { getCloudflareContext } from "@opennextjs/cloudflare";

type AuthEnv = {
	SESSION_SECRET?: string;
	SESSION_MAX_AGE_DAYS?: string;
};

export async function getSessionSecret(): Promise<string | null> {
	const fromProcess = process.env.SESSION_SECRET;
	if (fromProcess) {
		return fromProcess;
	}

	const { env } = await getCloudflareContext({ async: true });
	return (env as AuthEnv).SESSION_SECRET ?? null;
}

export async function getSessionMaxAgeDays(): Promise<string | undefined> {
	const fromProcess = process.env.SESSION_MAX_AGE_DAYS;
	if (fromProcess) {
		return fromProcess;
	}

	const { env } = await getCloudflareContext({ async: true });
	return (env as AuthEnv).SESSION_MAX_AGE_DAYS;
}
