import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	createChoices,
	deleteChoicesByMcqId,
	findChoiceByIdAndMcqId,
	findChoicesByMcqId,
	type McqChoiceRecord,
} from "@/lib/db/mcq-choices";
import { createAttempt } from "@/lib/db/mcq-attempts";
import {
	createMcq as createMcqRecord,
	deleteMcq as deleteMcqRecord,
	findMcqByIdAndUserId,
	listMcqsByUserId,
	updateMcq as updateMcqRecord,
	type McqRecord,
} from "@/lib/db/mcqs";
import {
	createMcq,
	deleteMcq,
	getMcq,
	listMcqs,
	recordAttempt,
	updateMcq,
} from "@/lib/services/mcq";

vi.mock("@/lib/db/client", () => ({
	getDb: vi.fn(async () => ({} as D1Database)),
}));

vi.mock("@/lib/db/mcqs", () => ({
	listMcqsByUserId: vi.fn(),
	findMcqByIdAndUserId: vi.fn(),
	createMcq: vi.fn(),
	updateMcq: vi.fn(),
	deleteMcq: vi.fn(),
	toMcqSummary: vi.fn((record: McqRecord) => ({
		id: record.id,
		name: record.name,
		question: record.question,
		createdAt: record.created_at,
		updatedAt: record.updated_at,
	})),
}));

vi.mock("@/lib/db/mcq-choices", () => ({
	findChoicesByMcqId: vi.fn(),
	findChoiceByIdAndMcqId: vi.fn(),
	deleteChoicesByMcqId: vi.fn(),
	createChoices: vi.fn(),
	toMcqChoice: vi.fn((record: McqChoiceRecord) => ({
		id: record.id,
		choiceText: record.choice_text,
		isCorrect: record.is_correct === 1,
		sortOrder: record.sort_order,
	})),
}));

vi.mock("@/lib/db/mcq-attempts", () => ({
	createAttempt: vi.fn(),
}));

const userId = "user-1";
const mcqId = "mcq-1";

const mcqRecord: McqRecord = {
	id: mcqId,
	user_id: userId,
	name: "Capital cities",
	question: "What is the capital of France?",
	created_at: "2026-09-03T10:00:00.000Z",
	updated_at: "2026-09-03T10:00:00.000Z",
};

const choiceRecords: McqChoiceRecord[] = [
	{
		id: "choice-1",
		mcq_id: mcqId,
		choice_text: "Paris",
		is_correct: 1,
		sort_order: 0,
		created_at: "2026-09-03T10:00:00.000Z",
		updated_at: "2026-09-03T10:00:00.000Z",
	},
	{
		id: "choice-2",
		mcq_id: mcqId,
		choice_text: "Lyon",
		is_correct: 0,
		sort_order: 1,
		created_at: "2026-09-03T10:00:00.000Z",
		updated_at: "2026-09-03T10:00:00.000Z",
	},
];

const createInput = {
	name: "Capital cities",
	question: "What is the capital of France?",
	choices: [
		{ choiceText: "Paris", isCorrect: true },
		{ choiceText: "Lyon", isCorrect: false },
	],
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe("listMcqs", () => {
	it("returns MCQ summaries for the user", async () => {
		vi.mocked(listMcqsByUserId).mockResolvedValue([mcqRecord]);

		const result = await listMcqs(userId);

		expect(result).toEqual([
			{
				id: mcqId,
				name: "Capital cities",
				question: "What is the capital of France?",
				createdAt: mcqRecord.created_at,
				updatedAt: mcqRecord.updated_at,
			},
		]);
	});
});

describe("getMcq", () => {
	it("returns null when the MCQ does not exist", async () => {
		vi.mocked(findMcqByIdAndUserId).mockResolvedValue(null);

		const result = await getMcq(userId, mcqId);

		expect(result).toBeNull();
	});

	it("returns the MCQ with ordered choices", async () => {
		vi.mocked(findMcqByIdAndUserId).mockResolvedValue(mcqRecord);
		vi.mocked(findChoicesByMcqId).mockResolvedValue(choiceRecords);

		const result = await getMcq(userId, mcqId);

		expect(result).toEqual({
			id: mcqId,
			name: "Capital cities",
			question: "What is the capital of France?",
			createdAt: mcqRecord.created_at,
			updatedAt: mcqRecord.updated_at,
			choices: [
				{
					id: "choice-1",
					choiceText: "Paris",
					isCorrect: true,
					sortOrder: 0,
				},
				{
					id: "choice-2",
					choiceText: "Lyon",
					isCorrect: false,
					sortOrder: 1,
				},
			],
		});
	});
});

describe("createMcq", () => {
	it("creates an MCQ and its choices", async () => {
		vi.mocked(createMcqRecord).mockResolvedValue(mcqRecord);
		vi.mocked(createChoices).mockResolvedValue(choiceRecords);

		const result = await createMcq(userId, createInput);

		expect(createMcqRecord).toHaveBeenCalledWith(expect.anything(), {
			userId,
			name: "Capital cities",
			question: "What is the capital of France?",
		});
		expect(createChoices).toHaveBeenCalledWith(expect.anything(), mcqId, [
			{ choiceText: "Paris", isCorrect: true, sortOrder: 0 },
			{ choiceText: "Lyon", isCorrect: false, sortOrder: 1 },
		]);
		expect(result.choices).toHaveLength(2);
	});
});

describe("updateMcq", () => {
	it("returns null when the MCQ does not exist", async () => {
		vi.mocked(updateMcqRecord).mockResolvedValue(null);

		const result = await updateMcq(userId, mcqId, createInput);

		expect(result).toBeNull();
		expect(deleteChoicesByMcqId).not.toHaveBeenCalled();
	});

	it("replaces choices when the MCQ exists", async () => {
		vi.mocked(updateMcqRecord).mockResolvedValue(mcqRecord);
		vi.mocked(createChoices).mockResolvedValue(choiceRecords);

		const result = await updateMcq(userId, mcqId, createInput);

		expect(deleteChoicesByMcqId).toHaveBeenCalledWith(expect.anything(), mcqId);
		expect(createChoices).toHaveBeenCalled();
		expect(result?.choices).toHaveLength(2);
	});
});

describe("deleteMcq", () => {
	it("returns whether the MCQ was deleted", async () => {
		vi.mocked(deleteMcqRecord).mockResolvedValue(true);

		expect(await deleteMcq(userId, mcqId)).toBe(true);
	});
});

describe("recordAttempt", () => {
	it("returns not_found when the MCQ does not exist", async () => {
		vi.mocked(findMcqByIdAndUserId).mockResolvedValue(null);

		const result = await recordAttempt(userId, mcqId, {
			selectedChoiceId: "choice-1",
		});

		expect(result).toEqual({ status: "not_found" });
	});

	it("returns invalid_choice when the choice does not belong to the MCQ", async () => {
		vi.mocked(findMcqByIdAndUserId).mockResolvedValue(mcqRecord);
		vi.mocked(findChoiceByIdAndMcqId).mockResolvedValue(null);

		const result = await recordAttempt(userId, mcqId, {
			selectedChoiceId: "choice-unknown",
		});

		expect(result).toEqual({ status: "invalid_choice" });
	});

	it("records a correct attempt", async () => {
		vi.mocked(findMcqByIdAndUserId).mockResolvedValue(mcqRecord);
		vi.mocked(findChoiceByIdAndMcqId).mockResolvedValue(choiceRecords[0]);
		vi.mocked(findChoicesByMcqId).mockResolvedValue(choiceRecords);

		const result = await recordAttempt(userId, mcqId, {
			selectedChoiceId: "choice-1",
		});

		expect(createAttempt).toHaveBeenCalledWith(expect.anything(), {
			mcqId,
			userId,
			selectedChoiceId: "choice-1",
			isCorrect: true,
		});
		expect(result).toEqual({
			status: "success",
			result: {
				isCorrect: true,
				correctChoiceId: "choice-1",
				message: "Correct!",
			},
		});
	});

	it("records an incorrect attempt", async () => {
		vi.mocked(findMcqByIdAndUserId).mockResolvedValue(mcqRecord);
		vi.mocked(findChoiceByIdAndMcqId).mockResolvedValue(choiceRecords[1]);
		vi.mocked(findChoicesByMcqId).mockResolvedValue(choiceRecords);

		const result = await recordAttempt(userId, mcqId, {
			selectedChoiceId: "choice-2",
		});

		expect(createAttempt).toHaveBeenCalledWith(expect.anything(), {
			mcqId,
			userId,
			selectedChoiceId: "choice-2",
			isCorrect: false,
		});
		expect(result).toEqual({
			status: "success",
			result: {
				isCorrect: false,
				correctChoiceId: "choice-1",
				message: "Incorrect.",
			},
		});
	});
});
