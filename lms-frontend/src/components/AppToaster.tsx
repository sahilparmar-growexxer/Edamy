"use client";

import { Toaster } from "react-hot-toast";

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          borderRadius: "18px",
          border: "1px solid #e2e8f0",
          background: "#ffffff",
          color: "#0f172a",
          boxShadow: "0 18px 60px -28px rgba(15, 23, 42, 0.28)",
          padding: "14px 16px",
        },
        success: {
          iconTheme: {
            primary: "#0f766e",
            secondary: "#ecfeff",
          },
        },
        error: {
          iconTheme: {
            primary: "#dc2626",
            secondary: "#fff1f2",
          },
        },
      }}
    />
  );
}
