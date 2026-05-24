"use client"
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { useRouter } from "next/navigation";
import { AuthBoundary } from "@convex-dev/better-auth/react";
import { PropsWithChildren } from "react";
import { api } from "@/convex/_generated/api";
import { isAuthError } from "./utils";

export const authClient = createAuthClient({
  plugins: [convexClient()],
});

export const ClientAuthBoundary = ({ children }: PropsWithChildren) => {
  const router = useRouter()
  return (
    <AuthBoundary
      authClient={authClient}
      onUnauth={() => router.push("/sign-in")}
      getAuthUserFn={api.auth.getCurrentUser}
      isAuthError={isAuthError}
    >
      {children}
    </AuthBoundary>
  )
}


export const { useSession, signOut, signIn } = authClient