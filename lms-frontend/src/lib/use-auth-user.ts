"use client";

import { useSyncExternalStore } from "react";
import {
  getStoredUserServerSnapshot,
  getStoredUserSnapshot,
  subscribeToStoredUser,
} from "@/lib/auth";

export function useAuthUser() {
  return useSyncExternalStore(
    subscribeToStoredUser,
    getStoredUserSnapshot,
    getStoredUserServerSnapshot,
  );
}
