import { cookies } from "next/headers";

import {
	getSessionMaxAgeSeconds,
	SESSION_COOKIE_NAME,
} from "@/lib/auth/constants";
import { getSessionMaxAgeDays } from "@/lib/auth/env";
import {
	signSessionToken,
	verifySessionToken,
} from "@/lib/auth/session-token";

export async function setSessionCookie(sessionId: string): Promise<void> {
	const signedToken = await signSessionToken(sessionId);
	const cookieStore = await cookies();
	const maxAgeDays = await getSessionMaxAgeDays();

	cookieStore.set(SESSION_COOKIE_NAME, signedToken, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: getSessionMaxAgeSeconds(maxAgeDays),
	});
}

export async function getSessionIdFromCookie(): Promise<string | null> {
	const cookieStore = await cookies();
	const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
	if (!token) {
		return null;
	}

	return verifySessionToken(token);
}

export async function clearSessionCookie(): Promise<void> {
	const cookieStore = await cookies();
	cookieStore.delete(SESSION_COOKIE_NAME);
}
