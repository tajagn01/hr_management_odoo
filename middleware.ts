import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Note: Middleware is deprecated in favor of proxy pattern in future Next.js versions
// This still works in Next.js 16.1.1 and is safe to use for production
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get the token from the session
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production", // Use secure cookies in production
  });

  const isLoggedIn = !!token;
  const isOnAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isOnProtectedRoute = pathname.startsWith("/admin") || pathname.startsWith("/employee") || pathname.startsWith("/manager");

  // Debug logging for production
  if (process.env.NODE_ENV === "production" && (isOnProtectedRoute || pathname === "/")) {
    console.log(`🔍 Middleware - Path: ${pathname}, LoggedIn: ${isLoggedIn}, Role: ${token?.role || 'none'}`);
  }

  // Redirect to login if trying to access protected routes without authentication
  if (isOnProtectedRoute && !isLoggedIn) {
    console.log(`🚫 Redirecting to login - No session found for: ${pathname}`);
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect to dashboard if trying to access auth routes while authenticated
  if (isOnAuthPage && isLoggedIn) {
    const role = token?.role as string;
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    } else if (role === "MANAGER") {
      return NextResponse.redirect(new URL("/manager", request.url));
    } else if (role === "EMPLOYEE") {
      return NextResponse.redirect(new URL("/employee", request.url));
    }
  }

  // Redirect authenticated users from root to their dashboard
  if (pathname === "/" && isLoggedIn) {
    const role = token?.role as string;
    console.log(`🔄 Redirecting authenticated user from root - Role: ${role}`);
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    } else if (role === "MANAGER") {
      return NextResponse.redirect(new URL("/manager", request.url));
    } else if (role === "EMPLOYEE") {
      return NextResponse.redirect(new URL("/employee", request.url));
    }
  }

  // Enforce role-based access to protected routes
  if (isLoggedIn && isOnProtectedRoute) {
    const role = token?.role as string;

    // Admin can access all routes
    if (role === "ADMIN") {
      return NextResponse.next();
    }

    // Manager can access /manager routes and /admin/leave-requests
    if (role === "MANAGER" && !pathname.startsWith("/manager") && pathname !== "/admin/leave-requests") {
      return NextResponse.redirect(new URL("/manager", request.url));
    }

    // Employee can only access /employee routes
    if (role === "EMPLOYEE") {
      // Allow access to complete-profile page
      if (pathname.startsWith("/employee/complete-profile")) {
        const profileCompleted = token?.profileCompleted;
        if (profileCompleted === true) {
          return NextResponse.redirect(new URL("/employee", request.url));
        }
        return NextResponse.next();
      }

      // Check if profile is incomplete
      const profileCompleted = token?.profileCompleted;
      if (profileCompleted === false) {
        // Redirect to profile completion wizard
        return NextResponse.redirect(new URL("/employee/complete-profile", request.url));
      }

      // Restrict access to non-employee routes
      if (!pathname.startsWith("/employee")) {
        return NextResponse.redirect(new URL("/employee", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
