import type { McqChoice } from "@/lib/db/mcq-choices";
import type { McqSummary } from "@/lib/db/mcqs";

export type McqDetail = McqSummary & {
	choices: McqChoice[];
};

export type McqListResponse = {
	mcqs: McqSummary[];
};

export type AttemptResponse = {
	isCorrect: boolean;
	correctChoiceId: string;
	message: string;
};

export type McqApiError = {
	error: string;
};

export type McqValidationError = {
	errors: Record<string, string>;
};

async function parseJsonResponse<T>(response: Response): Promise<T> {
	const data = (await response.json()) as T;
	return data;
}

export async function listMcqs(): Promise<McqListResponse> {
	const response = await fetch("/api/mcqs");

	if (!response.ok) {
		const error = await parseJsonResponse<McqApiError>(response);
		throw new Error(error.error);
	}

	return parseJsonResponse<McqListResponse>(response);
}

export async function getMcq(id: string): Promise<McqDetail> {
	const response = await fetch(`/api/mcqs/${id}`);

	if (!response.ok) {
		const error = await parseJsonResponse<McqApiError>(response);
		throw new Error(error.error);
	}

	return parseJsonResponse<McqDetail>(response);
}

export async function createMcq(
	body: Omit<McqDetail, "id" | "createdAt" | "updatedAt"> & {
		choices: Array<{ choiceText: string; isCorrect: boolean }>;
	},
): Promise<McqDetail> {
	const response = await fetch("/api/mcqs", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		if (response.status === 400) {
			const validation = await parseJsonResponse<McqValidationError>(response);
			throw validation;
		}

		const error = await parseJsonResponse<McqApiError>(response);
		throw new Error(error.error);
	}

	return parseJsonResponse<McqDetail>(response);
}

export async function updateMcq(
	id: string,
	body: {
		name: string;
		question: string;
		choices: Array<{ choiceText: string; isCorrect: boolean }>;
	},
): Promise<McqDetail> {
	const response = await fetch(`/api/mcqs/${id}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		if (response.status === 400) {
			const validation = await parseJsonResponse<McqValidationError>(response);
			throw validation;
		}

		const error = await parseJsonResponse<McqApiError>(response);
		throw new Error(error.error);
	}

	return parseJsonResponse<McqDetail>(response);
}

export async function deleteMcq(id: string): Promise<{ message: string }> {
	const response = await fetch(`/api/mcqs/${id}`, { method: "DELETE" });

	if (!response.ok) {
		const error = await parseJsonResponse<McqApiError>(response);
		throw new Error(error.error);
	}

	return parseJsonResponse<{ message: string }>(response);
}

export async function submitAttempt(
	mcqId: string,
	selectedChoiceId: string,
): Promise<AttemptResponse> {
	const response = await fetch(`/api/mcqs/${mcqId}/attempts`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ selectedChoiceId }),
	});

	if (!response.ok) {
		if (response.status === 400) {
			const validation = await parseJsonResponse<McqValidationError>(response);
			throw validation;
		}

		const error = await parseJsonResponse<McqApiError>(response);
		throw new Error(error.error);
	}

	return parseJsonResponse<AttemptResponse>(response);
}
