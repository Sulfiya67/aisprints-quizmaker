import { NextResponse } from "next/server";

import { MCQ_UNAUTHENTICATED_ERROR, requireSessionUser } from "@/lib/mcq/auth";
import {
	attemptSchema,
	formatValidationErrors,
} from "@/lib/mcq/validation";
import { recordAttempt } from "@/lib/services/mcq";

type RouteContext = {
	params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
	try {
		const user = await requireSessionUser();

		if (!user) {
			return NextResponse.json(
				{ error: MCQ_UNAUTHENTICATED_ERROR },
				{ status: 401 },
			);
		}

		const { id } = await context.params;
		const body = await request.json();
		const parsed = attemptSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ errors: formatValidationErrors(parsed.error) },
				{ status: 400 },
			);
		}

		const outcome = await recordAttempt(user.id, id, parsed.data);

		if (outcome.status === "not_found") {
			return NextResponse.json(
				{ error: "Question not found." },
				{ status: 404 },
			);
		}

		if (outcome.status === "invalid_choice") {
			return NextResponse.json(
				{ errors: { selectedChoiceId: "Please select a valid answer." } },
				{ status: 400 },
			);
		}

		return NextResponse.json(outcome.result, { status: 201 });
	} catch {
		return NextResponse.json(
			{ error: "Unable to submit answer. Please try again." },
			{ status: 500 },
		);
	}
}
