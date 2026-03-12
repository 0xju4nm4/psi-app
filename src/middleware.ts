import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const session = request.auth;

  if (!session || (session as any).error === "RefreshAccessTokenError") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/home/:path*", "/calendar/:path*", "/patients/:path*", "/settings/:path*"],
};
