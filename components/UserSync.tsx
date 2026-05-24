"use client";
import { useEffect, useRef } from "react";
import { useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";

export function UserSync() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const ensureUser = useMutation(api.user.ensureUser);
  const hasSynced = useRef(false);

  useEffect(() => {
    if (isAuthenticated && !isLoading && !hasSynced.current) {
      console.log("called user sync");

      hasSynced.current = true;
      ensureUser();
    }

    if (!isAuthenticated && !isLoading) {
      hasSynced.current = false;
    }
  }, [isAuthenticated, isLoading]);
  return null;
}