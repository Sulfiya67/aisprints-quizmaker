import {
	DEFAULT_SESSION_MAX_AGE_DAYS,
	getSessionMaxAgeSeconds,
} from "@/lib/auth/constants";
import { getSessionMaxAgeDays } from "@/lib/auth/env";
import { getDb } from "@/lib/db/client";
import {
	createSessionRecord,
	deleteSessionRecord,
	findValidSessionWithUser,
} from "@/lib/db/sessions";
import { type PublicUser } from "@/lib/db/users";

export type SessionUser = PublicUser;

function getSessionExpiry(maxAgeDays?: string): Date {
	const maxAgeSeconds = getSessionMaxAgeSeconds(maxAgeDays);
	return new Date(Date.now() + maxAgeSeconds * 1000);
}

export async function createSession(userId: string): Promise<string> {
	const db = await getDb();
	const maxAgeDays = await getSessionMaxAgeDays();
	const session = await createSessionRecord(
		db,
		userId,
		getSessionExpiry(maxAgeDays),
	);
	return session.id;
}

export async function getSessionUser(
	sessionId: string | undefined | null,
): Promise<SessionUser | null> {
	if (!sessionId) {
		return null;
	}

	const db = await getDb();
	const session = await findValidSessionWithUser(db, sessionId);
	if (!session) {
		return null;
	}

	return {
		id: session.user_id,
		fullName: session.full_name,
		email: session.email,
	};
}

export async function destroySession(sessionId: string | undefined | null): Promise<void> {
	if (!sessionId) {
		return;
	}

	const db = await getDb();
	await deleteSessionRecord(db, sessionId);
}

export { DEFAULT_SESSION_MAX_AGE_DAYS, getSessionMaxAgeSeconds };
