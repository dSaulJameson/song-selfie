import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

const mutationMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function isProtectedRoute(pathname: string) {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/venue" ||
    pathname.startsWith("/venue/") ||
    pathname === "/api/venues/connect" ||
    pathname.startsWith("/api/venues/connect/")
  );
}

function maintenanceRewrite(request: NextRequest) {
  const maintenanceEnabled = process.env.MIGRATION_MAINTENANCE === "1";
  const isMutation = mutationMethods.has(request.method.toUpperCase());
  const isMaintenanceRoute = request.nextUrl.pathname === "/api/maintenance";

  if (!maintenanceEnabled || !isMutation || isMaintenanceRoute) {
    return null;
  }

  return NextResponse.rewrite(new URL("/api/maintenance", request.url));
}

export default function proxy(request: NextRequest) {
  const maintenanceResponse = maintenanceRewrite(request);
  if (maintenanceResponse) {
    return maintenanceResponse;
  }

  const { pathname } = request.nextUrl;

  if (pathname === "/__clerk" || pathname.startsWith("/__clerk/")) {
    return NextResponse.redirect(new URL("/", request.url), 308);
  }

  if (pathname === "/sign-in" || pathname.startsWith("/sign-in/")) {
    const destination = new URL("/login", request.url);
    destination.search = request.nextUrl.search;
    return NextResponse.redirect(destination, 307);
  }

  const isVenueClaimPreview =
    pathname === "/venue" &&
    request.nextUrl.searchParams.get("created") === "1" &&
    Boolean(request.nextUrl.searchParams.get("venue")) &&
    Boolean(request.nextUrl.searchParams.get("email"));

  if (
    isProtectedRoute(pathname) &&
    !isVenueClaimPreview &&
    !getSessionCookie(request)
  ) {
    const destination = new URL("/login", request.url);
    destination.searchParams.set(
      "returnTo",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(destination);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|gif|png|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
