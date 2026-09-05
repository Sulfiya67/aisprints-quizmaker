"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PlusIcon } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	createMcq,
	updateMcq,
	type McqDetail,
	type McqValidationError,
} from "@/lib/mcq/api";
import { MAX_CHOICES, MIN_CHOICES } from "@/lib/mcq/constants";
import {
	createMcqSchema,
	formatValidationErrors,
} from "@/lib/mcq/validation";
import { cn } from "@/lib/utils";

type ChoiceField = {
	choiceText: string;
	isCorrect: boolean;
};

type McqFormProps = {
	mode: "create" | "edit";
	mcqId?: string;
	initialData?: Pick<McqDetail, "name" | "question" | "choices">;
};

function createDefaultChoices(): ChoiceField[] {
	return [
		{ choiceText: "", isCorrect: true },
		{ choiceText: "", isCorrect: false },
	];
}

function mapInitialChoices(
	choices: McqDetail["choices"],
): ChoiceField[] {
	return choices.map((choice) => ({
		choiceText: choice.choiceText,
		isCorrect: choice.isCorrect,
	}));
}

function isValidationError(error: unknown): error is McqValidationError {
	return (
		typeof error === "object" &&
		error !== null &&
		"errors" in error &&
		typeof (error as McqValidationError).errors === "object"
	);
}

export function McqForm({ mode, mcqId, initialData }: McqFormProps) {
	const router = useRouter();
	const [name, setName] = useState(initialData?.name ?? "");
	const [question, setQuestion] = useState(initialData?.question ?? "");
	const [choices, setChoices] = useState<ChoiceField[]>(
		initialData ? mapInitialChoices(initialData.choices) : createDefaultChoices(),
	);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [formError, setFormError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	function handleCorrectChange(index: number) {
		setChoices((current) =>
			current.map((choice, choiceIndex) => ({
				...choice,
				isCorrect: choiceIndex === index,
			})),
		);
	}

	function handleChoiceTextChange(index: number, value: string) {
		setChoices((current) =>
			current.map((choice, choiceIndex) =>
				choiceIndex === index ? { ...choice, choiceText: value } : choice,
			),
		);
	}

	function handleAddChoice() {
		if (choices.length >= MAX_CHOICES) {
			return;
		}

		setChoices((current) => [...current, { choiceText: "", isCorrect: false }]);
	}

	function handleRemoveChoice(index: number) {
		if (choices.length <= MIN_CHOICES) {
			return;
		}

		setChoices((current) => {
			const next = current.filter((_, choiceIndex) => choiceIndex !== index);

			if (!next.some((choice) => choice.isCorrect)) {
				next[0] = { ...next[0], isCorrect: true };
			}

			return next;
		});
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setFieldErrors({});
		setFormError(null);

		const payload = {
			name,
			question,
			choices,
		};

		const parsed = createMcqSchema.safeParse(payload);
		if (!parsed.success) {
			setFieldErrors(formatValidationErrors(parsed.error));
			return;
		}

		setIsSubmitting(true);

		try {
			if (mode === "create") {
				await createMcq(parsed.data);
			} else if (mcqId) {
				await updateMcq(mcqId, parsed.data);
			}

			router.push("/dashboard");
			router.refresh();
		} catch (error) {
			if (isValidationError(error)) {
				setFieldErrors(error.errors);
				return;
			}

			setFormError("Unable to save question. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} noValidate className="max-w-2xl">
			<FieldGroup>
				{formError ? (
					<div
						role="alert"
						className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
					>
						{formError}
					</div>
				) : null}

				<Field data-invalid={!!fieldErrors.name}>
					<FieldLabel htmlFor="mcq-name">Name</FieldLabel>
					<Input
						id="mcq-name"
						name="name"
						value={name}
						onChange={(event) => setName(event.target.value)}
						disabled={isSubmitting}
						aria-invalid={!!fieldErrors.name}
					/>
					<FieldError>{fieldErrors.name}</FieldError>
				</Field>

				<Field data-invalid={!!fieldErrors.question}>
					<FieldLabel htmlFor="mcq-question">Question</FieldLabel>
					<Textarea
						id="mcq-question"
						name="question"
						value={question}
						onChange={(event) => setQuestion(event.target.value)}
						disabled={isSubmitting}
						rows={4}
						aria-invalid={!!fieldErrors.question}
					/>
					<FieldError>{fieldErrors.question}</FieldError>
				</Field>

				<FieldSet data-invalid={!!fieldErrors.choices}>
					<FieldLegend>Choices</FieldLegend>
					<FieldDescription>
						Mark one choice as correct. Add between {MIN_CHOICES} and{" "}
						{MAX_CHOICES} choices.
					</FieldDescription>

					<div className="space-y-3">
						{choices.map((choice, index) => {
							const canRemove =
								!isSubmitting && choices.length > MIN_CHOICES;

							return (
								<div
									key={index}
									className="flex items-center gap-3"
								>
									<Input
										value={choice.choiceText}
										onChange={(event) =>
											handleChoiceTextChange(index, event.target.value)
										}
										placeholder={`Choice ${index + 1}`}
										disabled={isSubmitting}
										aria-label={`Choice ${index + 1} text`}
										className="flex-1"
									/>

									<label
										className={cn(
											"flex shrink-0 items-center gap-2 text-sm transition-opacity",
											!choice.isCorrect && "opacity-40",
										)}
									>
										<input
											type="radio"
											name="correctChoice"
											checked={choice.isCorrect}
											onChange={() => handleCorrectChange(index)}
											disabled={isSubmitting}
											className="size-4 accent-foreground"
										/>
										<span>Correct</span>
									</label>

									<button
										type="button"
										onClick={() => {
											if (canRemove) {
												handleRemoveChoice(index);
											}
										}}
										disabled={isSubmitting}
										aria-disabled={!canRemove}
										aria-label={`Remove choice ${index + 1}`}
										className={cn(
											"shrink-0 text-sm transition-opacity",
											!canRemove && "opacity-40",
										)}
									>
										Remove
									</button>
								</div>
							);
						})}
					</div>

					<Button
						type="button"
						variant="outline"
						size="sm"
						className="mt-3"
						onClick={handleAddChoice}
						disabled={isSubmitting || choices.length >= MAX_CHOICES}
					>
						<PlusIcon />
						Add choice
					</Button>

					<FieldError>{fieldErrors.choices}</FieldError>
				</FieldSet>

				<div className="flex flex-wrap gap-3">
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? "Saving..." : "Save"}
					</Button>
					<Link
						href="/dashboard"
						className={cn(buttonVariants({ variant: "outline" }))}
					>
						Cancel
					</Link>
				</div>
			</FieldGroup>
		</form>
	);
}
