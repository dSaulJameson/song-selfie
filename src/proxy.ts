import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

import { hasClerkServerKeys } from "@/lib/clerk";

const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/venue(.*)",
  "/api/venues/connect(.*)",
]);

const clerkOptions = {
  authorizedParties: [
    "https://songselfie.com",
    "https://www.songselfie.com",
    "http://localhost:3000",
  ],
  frontendApiProxy: {
    enabled: true,
  },
};

const mutationMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function maintenanceRewrite(request: NextRequest) {
  const maintenanceEnabled = process.env.MIGRATION_MAINTENANCE === "1";
  const isMutation = mutationMethods.has(request.method.toUpperCase());
  const isMaintenanceRoute = request.nextUrl.pathname === "/api/maintenance";

  if (!maintenanceEnabled || !isMutation || isMaintenanceRoute) {
    return null;
  }

  return NextResponse.rewrite(new URL("/api/maintenance", request.url));
}

const proxyHandler = hasClerkServerKeys()
  ? clerkMiddleware(async (auth, request) => {
      const maintenanceResponse = maintenanceRewrite(request);
      if (maintenanceResponse) {
        return maintenanceResponse;
      }

      const isVenueClaimPreview =
        request.nextUrl.pathname === "/venue" &&
        request.nextUrl.searchParams.get("created") === "1" &&
        Boolean(request.nextUrl.searchParams.get("venue")) &&
        Boolean(request.nextUrl.searchParams.get("email"));

      if (isProtectedRoute(request) && !isVenueClaimPreview) {
        await auth.protect();
      }
    }, clerkOptions)
  : function proxy(request: NextRequest) {
      return maintenanceRewrite(request) ?? NextResponse.next();
    };

export default proxyHandler;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|gif|png|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
