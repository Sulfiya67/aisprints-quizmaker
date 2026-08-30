import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth/password";
import {
	formatValidationErrors,
	signUpSchema,
} from "@/lib/auth/validation";
import { getDb } from "@/lib/db/client";
import {
	createUser,
	findUserByEmail,
	isUniqueConstraintError,
} from "@/lib/db/users";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const parsed = signUpSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ errors: formatValidationErrors(parsed.error) },
				{ status: 400 },
			);
		}

		const { fullName, email, password } = parsed.data;
		const db = await getDb();

		const existingUser = await findUserByEmail(db, email);
		if (existingUser) {
			return NextResponse.json(
				{ error: "An account already exists with this email address." },
				{ status: 409 },
			);
		}

		const passwordHash = await hashPassword(password);
		await createUser(db, { fullName, email, passwordHash });

		return NextResponse.json(
			{ message: "Account created successfully. Please sign in." },
			{ status: 201 },
		);
	} catch (error) {
		if (isUniqueConstraintError(error)) {
			return NextResponse.json(
				{ error: "An account already exists with this email address." },
				{ status: 409 },
			);
		}

		return NextResponse.json(
			{ error: "Unable to create account. Please try again." },
			{ status: 500 },
		);
	}
}
