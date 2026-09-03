import {
	createChoices,
	deleteChoicesByMcqId,
	findChoiceByIdAndMcqId,
	findChoicesByMcqId,
	toMcqChoice,
	type McqChoice,
} from "@/lib/db/mcq-choices";
import { createAttempt } from "@/lib/db/mcq-attempts";
import { getDb } from "@/lib/db/client";
import {
	createMcq as createMcqRecord,
	deleteMcq as deleteMcqRecord,
	findMcqByIdAndUserId,
	listMcqsByUserId,
	toMcqSummary,
	updateMcq as updateMcqRecord,
	type McqSummary,
} from "@/lib/db/mcqs";
import type {
	AttemptInput,
	CreateMcqInput,
	UpdateMcqInput,
} from "@/lib/mcq/validation";

export type McqDetail = McqSummary & {
	choices: McqChoice[];
};

export type AttemptResult = {
	isCorrect: boolean;
	correctChoiceId: string;
	message: string;
};

export type RecordAttemptOutcome =
	| { status: "success"; result: AttemptResult }
	| { status: "not_found" }
	| { status: "invalid_choice" };

function toMcqDetail(
	mcq: Awaited<ReturnType<typeof findMcqByIdAndUserId>>,
	choiceRecords: Awaited<ReturnType<typeof findChoicesByMcqId>>,
): McqDetail | null {
	if (!mcq) {
		return null;
	}

	return {
		...toMcqSummary(mcq),
		choices: choiceRecords.map(toMcqChoice),
	};
}

function mapChoicesForInsert(
	choices: CreateMcqInput["choices"],
): Array<{ choiceText: string; isCorrect: boolean; sortOrder: number }> {
	return choices.map((choice, index) => ({
		choiceText: choice.choiceText,
		isCorrect: choice.isCorrect,
		sortOrder: index,
	}));
}

export async function listMcqs(userId: string): Promise<McqSummary[]> {
	const db = await getDb();
	const records = await listMcqsByUserId(db, userId);
	return records.map(toMcqSummary);
}

export async function getMcq(
	userId: string,
	mcqId: string,
): Promise<McqDetail | null> {
	const db = await getDb();
	const mcq = await findMcqByIdAndUserId(db, mcqId, userId);

	if (!mcq) {
		return null;
	}

	const choiceRecords = await findChoicesByMcqId(db, mcqId);
	return toMcqDetail(mcq, choiceRecords);
}

export async function createMcq(
	userId: string,
	input: CreateMcqInput,
): Promise<McqDetail> {
	const db = await getDb();
	const mcq = await createMcqRecord(db, {
		userId,
		name: input.name,
		question: input.question,
	});
	const choiceRecords = await createChoices(
		db,
		mcq.id,
		mapChoicesForInsert(input.choices),
	);

	return {
		...toMcqSummary(mcq),
		choices: choiceRecords.map(toMcqChoice),
	};
}

export async function updateMcq(
	userId: string,
	mcqId: string,
	input: UpdateMcqInput,
): Promise<McqDetail | null> {
	const db = await getDb();
	const mcq = await updateMcqRecord(db, mcqId, userId, {
		name: input.name,
		question: input.question,
	});

	if (!mcq) {
		return null;
	}

	await deleteChoicesByMcqId(db, mcqId);
	const choiceRecords = await createChoices(
		db,
		mcqId,
		mapChoicesForInsert(input.choices),
	);

	return {
		...toMcqSummary(mcq),
		choices: choiceRecords.map(toMcqChoice),
	};
}

export async function deleteMcq(userId: string, mcqId: string): Promise<boolean> {
	const db = await getDb();
	return deleteMcqRecord(db, mcqId, userId);
}

export async function recordAttempt(
	userId: string,
	mcqId: string,
	input: AttemptInput,
): Promise<RecordAttemptOutcome> {
	const db = await getDb();
	const mcq = await findMcqByIdAndUserId(db, mcqId, userId);

	if (!mcq) {
		return { status: "not_found" };
	}

	const selectedChoice = await findChoiceByIdAndMcqId(
		db,
		input.selectedChoiceId,
		mcqId,
	);

	if (!selectedChoice) {
		return { status: "invalid_choice" };
	}

	const choiceRecords = await findChoicesByMcqId(db, mcqId);
	const correctChoice = choiceRecords.find((choice) => choice.is_correct === 1);

	if (!correctChoice) {
		throw new Error("MCQ has no correct choice");
	}

	const isCorrect = selectedChoice.is_correct === 1;

	await createAttempt(db, {
		mcqId,
		userId,
		selectedChoiceId: input.selectedChoiceId,
		isCorrect,
	});

	return {
		status: "success",
		result: {
			isCorrect,
			correctChoiceId: correctChoice.id,
			message: isCorrect ? "Correct!" : "Incorrect.",
		},
	};
}
