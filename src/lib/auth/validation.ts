import { z } from "zod";

const PASSWORD_MIN_LENGTH = 8;

function requiredString(message: string) {
	return z.preprocess(
		(value) => (value == null ? "" : value),
		z.string().trim().min(1, message),
	);
}

export function isValidPassword(password: string): boolean {
	if (password.length < PASSWORD_MIN_LENGTH) {
		return false;
	}

	return (
		/[A-Z]/.test(password) &&
		/[a-z]/.test(password) &&
		/[0-9]/.test(password) &&
		/[^A-Za-z0-9]/.test(password)
	);
}

export const signUpSchema = z
	.object({
		fullName: requiredString("Full Name is required."),
		email: z.preprocess(
			(value) => (value == null ? "" : value),
			z
				.string()
				.trim()
				.min(1, "Email Address is required.")
				.email("Please enter a valid email address."),
		),
		password: z.preprocess(
			(value) => (value == null ? "" : value),
			z
				.string()
				.min(1, "Password is required.")
				.refine(isValidPassword, "Password does not meet the required rules."),
		),
		confirmPassword: z.preprocess((value) => (value == null ? "" : value), z.string()),
	})
	.superRefine((data, ctx) => {
		if (data.password !== data.confirmPassword) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Passwords do not match.",
				path: ["confirmPassword"],
			});
		}
	});

export const signInSchema = z.object({
	email: z.preprocess(
		(value) => (value == null ? "" : value),
		z
			.string()
			.trim()
			.min(1, "Email is required.")
			.email("Please enter a valid email address."),
	),
	password: z.preprocess(
		(value) => (value == null ? "" : value),
		z.string().min(1, "Password is required."),
	),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

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
