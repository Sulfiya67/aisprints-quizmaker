export type McqRecord = {
	id: string;
	user_id: string;
	name: string;
	question: string;
	created_at: string;
	updated_at: string;
};

export type McqSummary = {
	id: string;
	name: string;
	question: string;
	createdAt: string;
	updatedAt: string;
};

export function toMcqSummary(record: McqRecord): McqSummary {
	return {
		id: record.id,
		name: record.name,
		question: record.question,
		createdAt: record.created_at,
		updatedAt: record.updated_at,
	};
}

export async function listMcqsByUserId(
	db: D1Database,
	userId: string,
): Promise<McqRecord[]> {
	const result = await db
		.prepare(
			`SELECT id, user_id, name, question, created_at, updated_at
       FROM mcqs
       WHERE user_id = ?1
       ORDER BY updated_at DESC`,
		)
		.bind(userId)
		.all<McqRecord>();

	return result.results;
}

export async function findMcqByIdAndUserId(
	db: D1Database,
	mcqId: string,
	userId: string,
): Promise<McqRecord | null> {
	const result = await db
		.prepare(
			`SELECT id, user_id, name, question, created_at, updated_at
       FROM mcqs
       WHERE id = ?1 AND user_id = ?2`,
		)
		.bind(mcqId, userId)
		.all<McqRecord>();

	return result.results[0] ?? null;
}

export async function createMcq(
	db: D1Database,
	input: { userId: string; name: string; question: string },
): Promise<McqRecord> {
	const result = await db
		.prepare(
			`INSERT INTO mcqs (user_id, name, question)
       VALUES (?1, ?2, ?3)
       RETURNING id, user_id, name, question, created_at, updated_at`,
		)
		.bind(input.userId, input.name.trim(), input.question.trim())
		.all<McqRecord>();

	const mcq = result.results[0];
	if (!mcq) {
		throw new Error("Failed to create MCQ");
	}

	return mcq;
}

export async function updateMcq(
	db: D1Database,
	mcqId: string,
	userId: string,
	input: { name: string; question: string },
): Promise<McqRecord | null> {
	const result = await db
		.prepare(
			`UPDATE mcqs
       SET name = ?1, question = ?2, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?3 AND user_id = ?4
       RETURNING id, user_id, name, question, created_at, updated_at`,
		)
		.bind(input.name.trim(), input.question.trim(), mcqId, userId)
		.all<McqRecord>();

	return result.results[0] ?? null;
}

export async function deleteMcq(
	db: D1Database,
	mcqId: string,
	userId: string,
): Promise<boolean> {
	const result = await db
		.prepare(`DELETE FROM mcqs WHERE id = ?1 AND user_id = ?2`)
		.bind(mcqId, userId)
		.run();

	return result.meta.changes > 0;
}
