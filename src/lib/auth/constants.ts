export const SESSION_COOKIE_NAME = "quizmaker_session";

/** Default session lifetime when SESSION_MAX_AGE_DAYS is not set. */
export const DEFAULT_SESSION_MAX_AGE_DAYS = 7;

export function getSessionMaxAgeSeconds(maxAgeDays?: string): number {
	const days = maxAgeDays
		? Number.parseInt(maxAgeDays, 10)
		: DEFAULT_SESSION_MAX_AGE_DAYS;

	if (!Number.isFinite(days) || days <= 0) {
		return DEFAULT_SESSION_MAX_AGE_DAYS * 24 * 60 * 60;
	}

	return days * 24 * 60 * 60;
}
