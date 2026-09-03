import { NextResponse } from "next/server";

import { MCQ_UNAUTHENTICATED_ERROR, requireSessionUser } from "@/lib/mcq/auth";
import {
	formatValidationErrors,
	createMcqSchema,
} from "@/lib/mcq/validation";
import { createMcq, listMcqs } from "@/lib/services/mcq";

export async function GET() {
	try {
		const user = await requireSessionUser();

		if (!user) {
			return NextResponse.json(
				{ error: MCQ_UNAUTHENTICATED_ERROR },
				{ status: 401 },
			);
		}

		const mcqs = await listMcqs(user.id);
		return NextResponse.json({ mcqs });
	} catch {
		return NextResponse.json(
			{ error: "Unable to load questions. Please try again." },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	try {
		const user = await requireSessionUser();

		if (!user) {
			return NextResponse.json(
				{ error: MCQ_UNAUTHENTICATED_ERROR },
				{ status: 401 },
			);
		}

		const body = await request.json();
		const parsed = createMcqSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ errors: formatValidationErrors(parsed.error) },
				{ status: 400 },
			);
		}

		const mcq = await createMcq(user.id, parsed.data);
		return NextResponse.json(mcq, { status: 201 });
	} catch {
		return NextResponse.json(
			{ error: "Unable to save question. Please try again." },
			{ status: 500 },
		);
	}
}
