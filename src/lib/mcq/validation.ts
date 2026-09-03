import { z } from "zod";

import {
	MAX_CHOICE_TEXT_LENGTH,
	MAX_CHOICES,
	MAX_NAME_LENGTH,
	MAX_QUESTION_LENGTH,
	MIN_CHOICES,
} from "@/lib/mcq/constants";

function requiredString(message: string) {
	return z.preprocess(
		(value) => (value == null ? "" : value),
		z.string().trim().min(1, message),
	);
}

const choiceInputSchema = z.object({
	choiceText: z.preprocess(
		(value) => (value == null ? "" : value),
		z
			.string()
			.trim()
			.min(1, "Choice text is required.")
			.max(
				MAX_CHOICE_TEXT_LENGTH,
				`Choice text must be ${MAX_CHOICE_TEXT_LENGTH} characters or fewer.`,
			),
	),
	isCorrect: z.boolean(),
});

function validateChoiceCountAndCorrectness(
	choices: Array<{ isCorrect: boolean }>,
	ctx: z.RefinementCtx,
) {
	if (choices.length < MIN_CHOICES) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: "At least 2 choices are required.",
			path: ["choices"],
		});
	}

	if (choices.length > MAX_CHOICES) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: "You can add up to 6 choices.",
			path: ["choices"],
		});
	}

	const correctCount = choices.filter((choice) => choice.isCorrect).length;

	if (correctCount === 0) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: "Select exactly one correct answer.",
			path: ["choices"],
		});
	}

	if (correctCount > 1) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: "Only one choice can be marked correct.",
			path: ["choices"],
		});
	}
}

const mcqBodySchema = z
	.object({
		name: requiredString("Name is required.").pipe(
			z.string().max(MAX_NAME_LENGTH, "Name must be 200 characters or fewer."),
		),
		question: requiredString("Question is required.").pipe(
			z
				.string()
				.max(
					MAX_QUESTION_LENGTH,
					"Question must be 2000 characters or fewer.",
				),
		),
		choices: z.array(choiceInputSchema),
	})
	.superRefine((data, ctx) => {
		validateChoiceCountAndCorrectness(data.choices, ctx);
	});

export const createMcqSchema = mcqBodySchema;
export const updateMcqSchema = mcqBodySchema;

export const attemptSchema = z.object({
	selectedChoiceId: requiredString("Please select a valid answer."),
});

export type CreateMcqInput = z.infer<typeof createMcqSchema>;
export type UpdateMcqInput = z.infer<typeof updateMcqSchema>;
export type AttemptInput = z.infer<typeof attemptSchema>;

export function formatValidationErrors(
	error: z.ZodError,
): Record<string, string> {
	const errors: Record<string, string> = {};

	for (const issue of error.issues) {
		const field = issue.path[0];
		if (typeof field === "string" && !(field in errors)) {
			errors[field] = issue.message;
		}
	}

	return errors;
}
