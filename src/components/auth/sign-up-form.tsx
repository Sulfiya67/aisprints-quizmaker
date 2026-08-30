"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	formatValidationErrors,
	signUpSchema,
} from "@/lib/auth/validation";

export function SignUpForm() {
	const router = useRouter();
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [formError, setFormError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setFieldErrors({});
		setFormError(null);

		const formData = new FormData(event.currentTarget);
		const values = {
			fullName: formData.get("fullName")?.toString() ?? "",
			email: formData.get("email")?.toString() ?? "",
			password: formData.get("password")?.toString() ?? "",
			confirmPassword: formData.get("confirmPassword")?.toString() ?? "",
		};

		const parsed = signUpSchema.safeParse(values);
		if (!parsed.success) {
			setFieldErrors(formatValidationErrors(parsed.error));
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await fetch("/api/auth/sign-up", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(parsed.data),
			});

			const data = (await response.json()) as {
				errors?: Record<string, string>;
				error?: string;
			};

			if (response.status === 400 && data.errors) {
				setFieldErrors(data.errors);
				return;
			}

			if (response.status === 409 && data.error) {
				setFieldErrors({ email: data.error });
				return;
			}

			if (!response.ok) {
				setFormError(
					data.error ?? "Unable to create account. Please try again.",
				);
				return;
			}

			router.push("/sign-in?registered=true");
		} catch {
			setFormError("Unable to create account. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
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

				<Field data-invalid={!!fieldErrors.fullName}>
					<FieldLabel htmlFor="fullName">Full Name</FieldLabel>
					<Input
						id="fullName"
						name="fullName"
						type="text"
						autoComplete="name"
						disabled={isSubmitting}
						aria-invalid={!!fieldErrors.fullName}
					/>
					<FieldError>{fieldErrors.fullName}</FieldError>
				</Field>

				<Field data-invalid={!!fieldErrors.email}>
					<FieldLabel htmlFor="email">Email Address</FieldLabel>
					<Input
						id="email"
						name="email"
						type="email"
						autoComplete="email"
						disabled={isSubmitting}
						aria-invalid={!!fieldErrors.email}
					/>
					<FieldError>{fieldErrors.email}</FieldError>
				</Field>

				<Field data-invalid={!!fieldErrors.password}>
					<FieldLabel htmlFor="password">Password</FieldLabel>
					<Input
						id="password"
						name="password"
						type="password"
						autoComplete="new-password"
						disabled={isSubmitting}
						aria-invalid={!!fieldErrors.password}
					/>
					<FieldError>{fieldErrors.password}</FieldError>
				</Field>

				<Field data-invalid={!!fieldErrors.confirmPassword}>
					<FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
					<Input
						id="confirmPassword"
						name="confirmPassword"
						type="password"
						autoComplete="new-password"
						disabled={isSubmitting}
						aria-invalid={!!fieldErrors.confirmPassword}
					/>
					<FieldError>{fieldErrors.confirmPassword}</FieldError>
				</Field>

				<Button type="submit" className="w-full" disabled={isSubmitting}>
					{isSubmitting ? "Creating account..." : "Sign Up"}
				</Button>
			</FieldGroup>
		</form>
	);
}
