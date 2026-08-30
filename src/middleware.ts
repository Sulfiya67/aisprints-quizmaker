import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSessionIdFromRequest } from "@/lib/auth/middleware-auth";
import {
	isAuthRoute,
	isProtectedRoute,
	signInRedirectUrl,
} from "@/lib/auth/routes";

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	if (!isProtectedRoute(pathname) && !isAuthRoute(pathname)) {
		return NextResponse.next();
	}

	const sessionId = await getSessionIdFromRequest(request);
	const isAuthenticated = sessionId !== null;

	if (isProtectedRoute(pathname) && !isAuthenticated) {
		return NextResponse.redirect(signInRedirectUrl(request.url));
	}

	if (isAuthRoute(pathname) && isAuthenticated) {
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/dashboard/:path*", "/sign-in", "/sign-up"],
};
