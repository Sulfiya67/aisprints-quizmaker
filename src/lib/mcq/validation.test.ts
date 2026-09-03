import { describe, expect, it } from "vitest";

import {
	MAX_CHOICE_TEXT_LENGTH,
	MAX_CHOICES,
	MAX_NAME_LENGTH,
	MAX_QUESTION_LENGTH,
	MIN_CHOICES,
} from "@/lib/mcq/constants";
import {
	attemptSchema,
	createMcqSchema,
	formatValidationErrors,
} from "@/lib/mcq/validation";

function validChoice(choiceText: string, isCorrect = false) {
	return { choiceText, isCorrect };
}

function validMcqBody(overrides: Record<string, unknown> = {}) {
	return {
		name: "Capital cities",
		question: "What is the capital of France?",
		choices: [
			validChoice("Paris", true),
			validChoice("Lyon", false),
		],
		...overrides,
	};
}

describe("createMcqSchema", () => {
	it("accepts a valid MCQ with two choices and one correct answer", () => {
		const result = createMcqSchema.safeParse(validMcqBody());

		expect(result.success).toBe(true);
	});

	it("rejects an empty name", () => {
		const result = createMcqSchema.safeParse(
			validMcqBody({ name: "" }),
		);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(formatValidationErrors(result.error).name).toBe(
				"Name is required.",
			);
		}
	});

	it("rejects a name longer than the maximum", () => {
		const result = createMcqSchema.safeParse(
			validMcqBody({ name: "a".repeat(MAX_NAME_LENGTH + 1) }),
		);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(formatValidationErrors(result.error).name).toBe(
				"Name must be 200 characters or fewer.",
			);
		}
	});

	it("rejects an empty question", () => {
		const result = createMcqSchema.safeParse(
			validMcqBody({ question: "" }),
		);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(formatValidationErrors(result.error).question).toBe(
				"Question is required.",
			);
		}
	});

	it("rejects a question longer than the maximum", () => {
		const result = createMcqSchema.safeParse(
			validMcqBody({ question: "a".repeat(MAX_QUESTION_LENGTH + 1) }),
		);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(formatValidationErrors(result.error).question).toBe(
				"Question must be 2000 characters or fewer.",
			);
		}
	});

	it("rejects fewer than the minimum number of choices", () => {
		const result = createMcqSchema.safeParse(
			validMcqBody({
				choices: [validChoice("Paris", true)],
			}),
		);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(formatValidationErrors(result.error).choices).toBe(
				"At least 2 choices are required.",
			);
		}
	});

	it("rejects more than the maximum number of choices", () => {
		const result = createMcqSchema.safeParse(
			validMcqBody({
				choices: Array.from({ length: MAX_CHOICES + 1 }, (_, index) =>
					validChoice(`Choice ${index + 1}`, index === 0),
				),
			}),
		);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(formatValidationErrors(result.error).choices).toBe(
				"You can add up to 6 choices.",
			);
		}
	});

	it("rejects empty choice text", () => {
		const result = createMcqSchema.safeParse(
			validMcqBody({
				choices: [validChoice("Paris", true), validChoice("", false)],
			}),
		);

		expect(result.success).toBe(false);
	});

	it("rejects when no choice is marked correct", () => {
		const result = createMcqSchema.safeParse(
			validMcqBody({
				choices: [validChoice("Paris", false), validChoice("Lyon", false)],
			}),
		);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(formatValidationErrors(result.error).choices).toBe(
				"Select exactly one correct answer.",
			);
		}
	});

	it("rejects when multiple choices are marked correct", () => {
		const result = createMcqSchema.safeParse(
			validMcqBody({
				choices: [validChoice("Paris", true), validChoice("Lyon", true)],
			}),
		);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(formatValidationErrors(result.error).choices).toBe(
				"Only one choice can be marked correct.",
			);
		}
	});

	it("accepts exactly the minimum number of choices", () => {
		const result = createMcqSchema.safeParse(
			validMcqBody({
				choices: [validChoice("Paris", true), validChoice("Lyon", false)],
			}),
		);

		expect(result.success).toBe(true);
	});

	it("accepts exactly the maximum number of choices", () => {
		const result = createMcqSchema.safeParse(
			validMcqBody({
				choices: Array.from({ length: MAX_CHOICES }, (_, index) =>
					validChoice(`Choice ${index + 1}`, index === 0),
				),
			}),
		);

		expect(result.success).toBe(true);
	});

	it("rejects choice text longer than the maximum", () => {
		const result = createMcqSchema.safeParse(
			validMcqBody({
				choices: [
					validChoice("a".repeat(MAX_CHOICE_TEXT_LENGTH + 1), true),
					validChoice("Lyon", false),
				],
			}),
		);

		expect(result.success).toBe(false);
	});

	it("treats null and undefined name as empty", () => {
		const result = createMcqSchema.safeParse(
			validMcqBody({ name: undefined }),
		);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(formatValidationErrors(result.error).name).toBe(
				"Name is required.",
			);
		}
	});
});

describe("attemptSchema", () => {
	it("accepts a non-empty selectedChoiceId", () => {
		const result = attemptSchema.safeParse({
			selectedChoiceId: "choice-abc",
		});

		expect(result.success).toBe(true);
	});

	it("rejects a missing selectedChoiceId", () => {
		const result = attemptSchema.safeParse({});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(formatValidationErrors(result.error).selectedChoiceId).toBe(
				"Please select a valid answer.",
			);
		}
	});

	it("rejects an empty selectedChoiceId", () => {
		const result = attemptSchema.safeParse({ selectedChoiceId: "" });

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(formatValidationErrors(result.error).selectedChoiceId).toBe(
				"Please select a valid answer.",
			);
		}
	});
});

describe("MIN_CHOICES", () => {
	it("is 2", () => {
		expect(MIN_CHOICES).toBe(2);
	});
});
