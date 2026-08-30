import { NextResponse } from "next/server";

import {
	clearSessionCookie,
	getSessionIdFromCookie,
} from "@/lib/auth/cookies";
import { destroySession } from "@/lib/auth/session";

export async function POST() {
	try {
		const sessionId = await getSessionIdFromCookie();
		await destroySession(sessionId);
		await clearSessionCookie();

		return NextResponse.json({
			message: "You have been logged out successfully.",
			redirect: "/sign-in",
		});
	} catch {
		return NextResponse.json(
			{ error: "Unable to sign out. Please try again." },
			{ status: 500 },
		);
	}
}
