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
	type McqDetail,
	type McqValidationError,
} from "@/lib/mcq/api";
import { cn } from "@/lib/utils";

type McqPreviewProps = {
	mcq: McqDetail;
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

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setFieldErrors({});
		setFormError(null);

		if (!selectedChoiceId) {
			setFieldErrors({
				selectedChoiceId: "Please select a valid answer.",
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
								"rounded-lg border px-3 py-2 text-sm",
								result.isCorrect
									? "border-primary/30 bg-primary/5 text-foreground"
									: "border-destructive/30 bg-destructive/5 text-destructive",
							)}
						>
							{result.message}
						</div>
					) : null}

					<FieldSet data-invalid={!!fieldErrors.selectedChoiceId}>
						<FieldLabel>Choose an answer</FieldLabel>
						<div className="space-y-2">
							{mcq.choices.map((choice) => (
								<label
									key={choice.id}
									className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm has-checked:border-primary/40 has-checked:bg-primary/5"
								>
									<input
										type="radio"
										name="selectedChoice"
										value={choice.id}
										checked={selectedChoiceId === choice.id}
										onChange={() => setSelectedChoiceId(choice.id)}
										disabled={isSubmitting}
										className="size-4 accent-primary"
									/>
									<span>{choice.choiceText}</span>
								</label>
							))}
						</div>
						<Field data-invalid={!!fieldErrors.selectedChoiceId}>
							<FieldError>{fieldErrors.selectedChoiceId}</FieldError>
						</Field>
					</FieldSet>

					<div className="flex flex-wrap gap-3">
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Submitting..." : "Submit answer"}
						</Button>
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
