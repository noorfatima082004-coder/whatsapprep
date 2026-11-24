"use client";

import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            classNames: {
              toast: "border border-line shadow-card",
            },
          }}
        />
      </AppProvider>
    </AuthProvider>
  );
}
