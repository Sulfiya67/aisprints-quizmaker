import { NextResponse } from "next/server";

import { getSessionIdFromCookie } from "@/lib/auth/cookies";
import { getSessionUser } from "@/lib/auth/session";

export async function GET() {
	const sessionId = await getSessionIdFromCookie();
	const user = await getSessionUser(sessionId);

	return NextResponse.json({ user });
}
