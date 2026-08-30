export const AUTH_ROUTES = ["/sign-in", "/sign-up"] as const;

export const PROTECTED_ROUTE_PREFIXES = ["/dashboard"] as const;

export function isAuthRoute(pathname: string): boolean {
	return AUTH_ROUTES.some(
		(route) => pathname === route || pathname.startsWith(`${route}/`),
	);
}

export function isProtectedRoute(pathname: string): boolean {
	return PROTECTED_ROUTE_PREFIXES.some(
		(route) => pathname === route || pathname.startsWith(`${route}/`),
	);
}

export const SIGN_IN_MESSAGE = "Please sign in to continue.";

export function signInRedirectUrl(origin: string): URL {
	const url = new URL("/sign-in", origin);
	url.searchParams.set("message", SIGN_IN_MESSAGE);
	return url;
}
