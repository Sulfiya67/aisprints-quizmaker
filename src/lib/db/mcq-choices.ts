export type McqChoiceRecord = {
	id: string;
	mcq_id: string;
	choice_text: string;
	is_correct: number;
	sort_order: number;
	created_at: string;
	updated_at: string;
};

export type McqChoice = {
	id: string;
	choiceText: string;
	isCorrect: boolean;
	sortOrder: number;
};

export function toMcqChoice(record: McqChoiceRecord): McqChoice {
	return {
		id: record.id,
		choiceText: record.choice_text,
		isCorrect: record.is_correct === 1,
		sortOrder: record.sort_order,
	};
}

export async function findChoicesByMcqId(
	db: D1Database,
	mcqId: string,
): Promise<McqChoiceRecord[]> {
	const result = await db
		.prepare(
			`SELECT id, mcq_id, choice_text, is_correct, sort_order, created_at, updated_at
       FROM mcq_choices
       WHERE mcq_id = ?1
       ORDER BY sort_order ASC`,
		)
		.bind(mcqId)
		.all<McqChoiceRecord>();

	return result.results;
}

export async function findChoiceByIdAndMcqId(
	db: D1Database,
	choiceId: string,
	mcqId: string,
): Promise<McqChoiceRecord | null> {
	const result = await db
		.prepare(
			`SELECT id, mcq_id, choice_text, is_correct, sort_order, created_at, updated_at
       FROM mcq_choices
       WHERE id = ?1 AND mcq_id = ?2`,
		)
		.bind(choiceId, mcqId)
		.all<McqChoiceRecord>();

	return result.results[0] ?? null;
}

export async function deleteChoicesByMcqId(
	db: D1Database,
	mcqId: string,
): Promise<void> {
	await db
		.prepare(`DELETE FROM mcq_choices WHERE mcq_id = ?1`)
		.bind(mcqId)
		.run();
}

export async function createChoices(
	db: D1Database,
	mcqId: string,
	choices: Array<{ choiceText: string; isCorrect: boolean; sortOrder: number }>,
): Promise<McqChoiceRecord[]> {
	const created: McqChoiceRecord[] = [];

	for (const choice of choices) {
		const result = await db
			.prepare(
				`INSERT INTO mcq_choices (mcq_id, choice_text, is_correct, sort_order)
         VALUES (?1, ?2, ?3, ?4)
         RETURNING id, mcq_id, choice_text, is_correct, sort_order, created_at, updated_at`,
			)
			.bind(
				mcqId,
				choice.choiceText.trim(),
				choice.isCorrect ? 1 : 0,
				choice.sortOrder,
			)
			.all<McqChoiceRecord>();

		const record = result.results[0];
		if (!record) {
			throw new Error("Failed to create MCQ choice");
		}

		created.push(record);
	}

	return created;
}
