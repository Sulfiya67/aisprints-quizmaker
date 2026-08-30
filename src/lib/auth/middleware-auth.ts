import type { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { verifySessionToken } from "@/lib/auth/session-token";

export async function getSessionIdFromRequest(
	request: NextRequest,
): Promise<string | null> {
	const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
	if (!token) {
		return null;
	}

	return verifySessionToken(token);
}

export async function isAuthenticatedRequest(
	request: NextRequest,
): Promise<boolean> {
	const sessionId = await getSessionIdFromRequest(request);
	return sessionId !== null;
}
