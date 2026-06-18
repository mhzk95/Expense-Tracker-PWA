import { withAuth } from "next-auth/middleware";

// Protect all routes except /auth/login, /auth/register, /api, and public assets
export default withAuth({
  pages: {
    signIn: "/auth/login",
  },
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - auth (login/register pages)
     * - favicon.ico, manifest.json, sw.js, apple-icon, etc
     */
    "/((?!api|_next/static|_next/image|auth|.*\\.svg|.*\\.png|.*\\.ico|.*\\.webmanifest|manifest\\.json|sw\\.js|offline).*)",
  ],
};
