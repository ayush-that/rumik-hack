import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
    const sessionCookie = getSessionCookie(request);
    const pathname = request.nextUrl.pathname;

    if (pathname === "/sign-in" && sessionCookie) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (!sessionCookie && pathname !== "/sign-in") {
        return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard", "/sign-in"],
};
