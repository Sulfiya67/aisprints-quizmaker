import { NextResponse } from "next/server";

import { MCQ_UNAUTHENTICATED_ERROR, requireSessionUser } from "@/lib/mcq/auth";
import {
	formatValidationErrors,
	updateMcqSchema,
} from "@/lib/mcq/validation";
import {
	deleteMcq,
	getMcq,
	updateMcq,
} from "@/lib/services/mcq";

type RouteContext = {
	params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
	try {
		const user = await requireSessionUser();

		if (!user) {
			return NextResponse.json(
				{ error: MCQ_UNAUTHENTICATED_ERROR },
				{ status: 401 },
			);
		}

		const { id } = await context.params;
		const mcq = await getMcq(user.id, id);

		if (!mcq) {
			return NextResponse.json(
				{ error: "Question not found." },
				{ status: 404 },
			);
		}

		return NextResponse.json(mcq);
	} catch {
		return NextResponse.json(
			{ error: "Unable to load questions. Please try again." },
			{ status: 500 },
		);
	}
}

export async function PUT(request: Request, context: RouteContext) {
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
		const parsed = updateMcqSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ errors: formatValidationErrors(parsed.error) },
				{ status: 400 },
			);
		}

		const mcq = await updateMcq(user.id, id, parsed.data);

		if (!mcq) {
			return NextResponse.json(
				{ error: "Question not found." },
				{ status: 404 },
			);
		}

		return NextResponse.json(mcq);
	} catch {
		return NextResponse.json(
			{ error: "Unable to save question. Please try again." },
			{ status: 500 },
		);
	}
}

export async function DELETE(_request: Request, context: RouteContext) {
	try {
		const user = await requireSessionUser();

		if (!user) {
			return NextResponse.json(
				{ error: MCQ_UNAUTHENTICATED_ERROR },
				{ status: 401 },
			);
		}

		const { id } = await context.params;
		const deleted = await deleteMcq(user.id, id);

		if (!deleted) {
			return NextResponse.json(
				{ error: "Question not found." },
				{ status: 404 },
			);
		}

		return NextResponse.json({
			message: "Question deleted successfully.",
		});
	} catch {
		return NextResponse.json(
			{ error: "Unable to delete question. Please try again." },
			{ status: 500 },
		);
	}
}
