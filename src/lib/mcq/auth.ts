import { getSessionIdFromCookie } from "@/lib/auth/cookies";
import { SIGN_IN_MESSAGE } from "@/lib/auth/routes";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";

export const MCQ_UNAUTHENTICATED_ERROR = SIGN_IN_MESSAGE;

export async function requireSessionUser(): Promise<SessionUser | null> {
	const sessionId = await getSessionIdFromCookie();
	return getSessionUser(sessionId);
}
