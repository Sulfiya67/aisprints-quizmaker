export type McqAttemptRecord = {
	id: string;
	mcq_id: string;
	user_id: string;
	selected_choice_id: string;
	is_correct: number;
	created_at: string;
};

export type McqAttempt = {
	id: string;
	mcqId: string;
	userId: string;
	selectedChoiceId: string;
	isCorrect: boolean;
	createdAt: string;
};

export function toMcqAttempt(record: McqAttemptRecord): McqAttempt {
	return {
		id: record.id,
		mcqId: record.mcq_id,
		userId: record.user_id,
		selectedChoiceId: record.selected_choice_id,
		isCorrect: record.is_correct === 1,
		createdAt: record.created_at,
	};
}

export async function createAttempt(
	db: D1Database,
	input: {
		mcqId: string;
		userId: string;
		selectedChoiceId: string;
		isCorrect: boolean;
	},
): Promise<McqAttemptRecord> {
	const result = await db
		.prepare(
			`INSERT INTO mcq_attempts (mcq_id, user_id, selected_choice_id, is_correct)
       VALUES (?1, ?2, ?3, ?4)
       RETURNING id, mcq_id, user_id, selected_choice_id, is_correct, created_at`,
		)
		.bind(
			input.mcqId,
			input.userId,
			input.selectedChoiceId,
			input.isCorrect ? 1 : 0,
		)
		.all<McqAttemptRecord>();

	const attempt = result.results[0];
	if (!attempt) {
		throw new Error("Failed to create MCQ attempt");
	}

	return attempt;
}
