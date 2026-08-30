import { NextResponse } from "next/server";

import { setSessionCookie } from "@/lib/auth/cookies";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import {
	formatValidationErrors,
	signInSchema,
} from "@/lib/auth/validation";
import { getDb } from "@/lib/db/client";
import { findUserByEmail } from "@/lib/db/users";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const parsed = signInSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ errors: formatValidationErrors(parsed.error) },
				{ status: 400 },
			);
		}

		const { email, password } = parsed.data;
		const db = await getDb();
		const user = await findUserByEmail(db, email);

		if (!user || !(await verifyPassword(password, user.password_hash))) {
			return NextResponse.json(
				{ error: "Invalid email or password." },
				{ status: 401 },
			);
		}

		const sessionId = await createSession(user.id);
		await setSessionCookie(sessionId);

		return NextResponse.json({ redirect: "/dashboard" });
	} catch {
		return NextResponse.json(
			{ error: "Unable to sign in. Please try again." },
			{ status: 500 },
		);
	}
}
