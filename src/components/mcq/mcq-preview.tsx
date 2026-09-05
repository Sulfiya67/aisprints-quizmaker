"use client";

import Link from "next/link";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldSet,
} from "@/components/ui/field";
import {
	submitAttempt,
	type AttemptResponse,
	type McqValidationError,
} from "@/lib/mcq/api";
import { cn } from "@/lib/utils";

export type PreviewChoice = {
	id: string;
	choiceText: string;
};

export type PreviewMcq = {
	id: string;
	name: string;
	question: string;
	choices: PreviewChoice[];
};

type McqPreviewProps = {
	mcq: PreviewMcq;
};

function isValidationError(error: unknown): error is McqValidationError {
	return (
		typeof error === "object" &&
		error !== null &&
		"errors" in error &&
		typeof (error as McqValidationError).errors === "object"
	);
}

export function McqPreview({ mcq }: McqPreviewProps) {
	const [selectedChoiceId, setSelectedChoiceId] = useState<string>("");
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [formError, setFormError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [result, setResult] = useState<AttemptResponse | null>(null);

	const hasSubmitted = result !== null;

	function handleTryAgain() {
		setResult(null);
		setSelectedChoiceId("");
		setFieldErrors({});
		setFormError(null);
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setFieldErrors({});
		setFormError(null);

		if (!selectedChoiceId) {
			setFieldErrors({
				selectedChoiceId: "Please select an answer before submitting.",
			});
			return;
		}

		setIsSubmitting(true);

		try {
			const attemptResult = await submitAttempt(mcq.id, selectedChoiceId);
			setResult(attemptResult);
		} catch (error) {
			if (isValidationError(error)) {
				setFieldErrors(error.errors);
				return;
			}

			setFormError("Unable to submit answer. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="max-w-2xl space-y-6">
			<div className="space-y-2">
				<h2 className="font-heading text-xl tracking-tight">{mcq.name}</h2>
				<p className="text-base text-foreground">{mcq.question}</p>
			</div>

			<form onSubmit={handleSubmit} noValidate>
				<FieldGroup>
					{formError ? (
						<div
							role="alert"
							className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
						>
							{formError}
						</div>
					) : null}

					{result ? (
						<div
							role="status"
							className={cn(
								"rounded-lg border px-3 py-2 text-sm font-medium",
								result.isCorrect
									? "border-primary/30 bg-primary/5 text-foreground"
									: "border-destructive/30 bg-destructive/5 text-destructive",
							)}
						>
							{result.message}
						</div>
					) : (
						<p className="text-sm text-muted-foreground">
							Select an answer, then click Submit answer.
						</p>
					)}

					<FieldSet data-invalid={!!fieldErrors.selectedChoiceId}>
						<FieldLabel>Choose an answer</FieldLabel>
						<div className="space-y-2">
							{mcq.choices.map((choice) => {
								const isSelected = selectedChoiceId === choice.id;
								const isCorrectChoice =
									result?.correctChoiceId === choice.id;

								return (
									<label
										key={choice.id}
										className={cn(
											"flex items-center gap-3 rounded-lg border px-3 py-2 text-sm",
											!hasSubmitted &&
												isSelected &&
												"border-primary/40 bg-primary/5",
											!hasSubmitted &&
												!isSelected &&
												"border-border",
											hasSubmitted &&
												isCorrectChoice &&
												"border-primary/40 bg-primary/5",
											hasSubmitted &&
												isSelected &&
												result &&
												!result.isCorrect &&
												"border-destructive/40 bg-destructive/5",
											hasSubmitted &&
												!isSelected &&
												!isCorrectChoice &&
												"border-border opacity-70",
										)}
									>
										<input
											type="radio"
											name="selectedChoice"
											value={choice.id}
											checked={isSelected}
											onChange={() => {
												if (hasSubmitted) {
													return;
												}

												setSelectedChoiceId(choice.id);
												setFieldErrors((current) => {
													if (!current.selectedChoiceId) {
														return current;
													}

													const next = { ...current };
													delete next.selectedChoiceId;
													return next;
												});
											}}
											disabled={isSubmitting || hasSubmitted}
											className="size-4 accent-primary"
										/>
										<span className="flex-1">{choice.choiceText}</span>
										{hasSubmitted && isCorrectChoice ? (
											<span className="text-xs font-medium text-primary">
												Correct answer
											</span>
										) : null}
										{hasSubmitted &&
										isSelected &&
										result &&
										!result.isCorrect ? (
											<span className="text-xs font-medium text-destructive">
												Your answer
											</span>
										) : null}
									</label>
								);
							})}
						</div>
						<Field data-invalid={!!fieldErrors.selectedChoiceId}>
							<FieldError>{fieldErrors.selectedChoiceId}</FieldError>
						</Field>
					</FieldSet>

					<div className="flex flex-wrap gap-3">
						{hasSubmitted ? (
							<Button type="button" onClick={handleTryAgain}>
								Try again
							</Button>
						) : (
							<Button
								type="submit"
								disabled={isSubmitting || !selectedChoiceId}
							>
								{isSubmitting ? "Submitting..." : "Submit answer"}
							</Button>
						)}
						<Link
							href="/dashboard"
							className={cn(buttonVariants({ variant: "outline" }))}
						>
							Back to Dashboard
						</Link>
					</div>
				</FieldGroup>
			</form>
		</div>
	);
}
